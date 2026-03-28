from __future__ import annotations

import asyncio
import json
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models import CreateJobRequest, JobEnvelope
from pipeline import build_job_urls, process_job
from repository import repository
from utils import utc_now_iso

router = APIRouter(prefix="/api/analysis/jobs", tags=["jobs"])


@router.post("", response_model=JobEnvelope)
async def create_analysis_job(request: CreateJobRequest):
    """Create a new analysis job for a video."""
    video = await repository.get_video(request.video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video was not found. Start from /api/uploads/init.")
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    now = utc_now_iso()
    events_url, result_url = build_job_urls(job_id)
    job_row = await repository.create_job(
        {
            "id": job_id,
            "video_id": request.video_id,
            "status": "queued",
            "stage": "job.created",
            "progress_percent": 0,
            "error_message": None,
            "user_context": request.user_context,
            "preferred_platform": request.preferred_platform,
            "started_at": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    await repository.update_video(request.video_id, {"storage_path": request.storage_path, "status": "queued"})
    await repository.add_event(
        job_id=job_id,
        video_id=request.video_id,
        event_type="job.created",
        status="queued",
        stage="job.created",
        progress_percent=0,
        payload={"events_url": events_url, "result_url": result_url},
    )
    return JobEnvelope(
        job_id=job_id,
        video_id=request.video_id,
        status=job_row["status"],
        stage=job_row["stage"],
        progress_percent=job_row["progress_percent"],
        events_url=events_url,
        result_url=result_url,
    )


@router.get("/{job_id}", response_model=JobEnvelope)
async def get_analysis_job(job_id: str):
    """Get status of an analysis job."""
    job = await repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")
    events_url, result_url = build_job_urls(job_id)
    return JobEnvelope(
        job_id=job["id"],
        video_id=job["video_id"],
        status=job["status"],
        stage=job["stage"],
        progress_percent=job["progress_percent"],
        events_url=events_url,
        result_url=result_url,
        error_message=job.get("error_message"),
    )


@router.get("/{job_id}/result")
async def get_analysis_result(job_id: str):
    """Get the analysis result for a completed job."""
    result = await repository.get_result(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not ready.")
    return result["payload"]


@router.get("/{job_id}/events")
async def stream_analysis_events(job_id: str):
    """Stream analysis events via Server-Sent Events."""
    job = await repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")

    active_processor: asyncio.Task[Any] | None = None
    if job["status"] == "queued":
        active_processor = asyncio.create_task(
            process_job(job_id, job["video_id"], job.get("preferred_platform"))
        )

    async def event_generator():
        sequence = 0
        keepalive_started = asyncio.get_event_loop().time()
        while True:
            events = await repository.get_events_after(job_id, sequence)
            if events:
                for event in events:
                    sequence = max(sequence, int(event["sequence"]))
                    envelope = {
                        "type": event["event_type"],
                        "job_id": event["job_id"],
                        "video_id": event["video_id"],
                        "status": event.get("status"),
                        "stage": event.get("stage"),
                        "progress_percent": event.get("progress_percent"),
                        "sequence": event["sequence"],
                        "payload": event.get("payload"),
                        "timestamp": event.get("created_at"),
                    }
                    yield f"event: {event['event_type']}\ndata: {json.dumps(envelope, ensure_ascii=False)}\n\n"
                    if event["event_type"] in {"analysis.completed", "job.failed"}:
                        return
                keepalive_started = asyncio.get_event_loop().time()
            else:
                current_job = await repository.get_job(job_id)
                if current_job and current_job["status"] in {"completed", "failed"}:
                    return
                if asyncio.get_event_loop().time() - keepalive_started >= 25:
                    yield "event: keepalive\ndata: {}\n\n"
                    keepalive_started = asyncio.get_event_loop().time()
                await asyncio.sleep(0.8)

    async def wrapped_generator():
        try:
            async for chunk in event_generator():
                yield chunk
        finally:
            if active_processor and not active_processor.done():
                await active_processor

    return StreamingResponse(
        wrapped_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
