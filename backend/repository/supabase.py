from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from supabase import Client, create_client

from config import SUPABASE_BUCKET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from utils import utc_now_iso

# Local storage for when Supabase is not configured
LOCAL_VIDEOS: dict[str, dict[str, Any]] = {}
LOCAL_JOBS: dict[str, dict[str, Any]] = {}
LOCAL_RESULTS: dict[str, dict[str, Any]] = {}
LOCAL_PERSONAS: dict[str, list[dict[str, Any]]] = defaultdict(list)
LOCAL_EVENTS: dict[str, list[dict[str, Any]]] = defaultdict(list)
LOCAL_EVENT_SEQUENCE = 0


class Repository:
    def __init__(self) -> None:
        self.client: Client | None = (
            create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
            else None
        )

    async def _run(self, func, *args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)

    @property
    def configured(self) -> bool:
        return self.client is not None

    async def create_video(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            LOCAL_VIDEOS[payload["id"]] = payload
            return payload

        def _insert():
            return self.client.table("videos").insert(payload).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def update_video(self, video_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        patch["updated_at"] = utc_now_iso()
        if not self.client:
            LOCAL_VIDEOS[video_id].update(patch)
            return LOCAL_VIDEOS[video_id]

        def _update():
            return self.client.table("videos").update(patch).eq("id", video_id).execute()

        result = await self._run(_update)
        return result.data[0]

    async def get_video(self, video_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_VIDEOS.get(video_id)

        def _select():
            return self.client.table("videos").select("*").eq("id", video_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def create_job(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            LOCAL_JOBS[payload["id"]] = payload
            return payload

        def _insert():
            return self.client.table("analysis_jobs").insert(payload).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def update_job(self, job_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        patch["updated_at"] = utc_now_iso()
        if not self.client:
            LOCAL_JOBS[job_id].update(patch)
            return LOCAL_JOBS[job_id]

        def _update():
            return self.client.table("analysis_jobs").update(patch).eq("id", job_id).execute()

        result = await self._run(_update)
        return result.data[0]

    async def get_job(self, job_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_JOBS.get(job_id)

        def _select():
            return self.client.table("analysis_jobs").select("*").eq("id", job_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def save_persona_batch(self, job_id: str, personas: list[dict[str, Any]]) -> None:
        if not personas:
            return
        if not self.client:
            LOCAL_PERSONAS[job_id].extend(personas)
            return

        rows = [
            {
                "job_id": persona["job_id"],
                "video_id": persona["video_id"],
                "persona_id": persona["persona_id"],
                "name": persona["name"],
                "archetype": persona.get("archetype"),
                "demographic_profile_id": persona.get("demographic_profile_id"),
                "demographic_profile_label": persona.get("demographic_profile_label"),
                "age_range": persona["age_range"],
                "country": persona["country"],
                "occupation": persona["occupation"],
                "income_bracket": persona["income_bracket"],
                "social_status": persona["social_status"],
                "interests": persona["interests"],
                "hobbies": persona["hobbies"],
                "life_story": persona["life_story"],
                "platform_habits": persona["platform_habits"],
                "motivations": persona["motivations"],
                "frustrations": persona["frustrations"],
                "segment_label": persona["segment_label"],
                "color": persona["color"],
                "batch_index": persona["batch_index"],
                "dropoff_second": persona["dropoff_second"],
                "retention_percent": persona["retention_percent"],
                "reason_code": persona.get("reason_code"),
                "reason_label": persona.get("reason_label"),
                "why_they_left": persona["why_they_left"],
                "summary_of_interacion": persona["summary_of_interacion"],
                "liked_moment": persona.get("liked_moment"),
                "disliked_moment": persona.get("disliked_moment"),
                "evidence_start_second": persona.get("evidence_start_second"),
                "evidence_end_second": persona.get("evidence_end_second"),
                "evidence_excerpt": persona.get("evidence_excerpt"),
                "decision_stage": persona.get("decision_stage"),
            }
            for persona in personas
        ]

        def _insert():
            return self.client.table("persona_results").insert(rows).execute()

        await self._run(_insert)

    async def save_result(self, payload: dict[str, Any], score_summary: dict[str, Any]) -> None:
        row = {
            "job_id": payload["job_id"],
            "video_id": payload["video_id"],
            "payload": payload,
            "overall_score": score_summary["overall_score"],
            "ad_readiness_score": score_summary["ad_readiness_score"],
            "created_at": utc_now_iso(),
        }
        if not self.client:
            LOCAL_RESULTS[payload["job_id"]] = row
            return

        def _insert():
            return self.client.table("analysis_results").upsert(row).execute()

        await self._run(_insert)

    async def get_result(self, job_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_RESULTS.get(job_id)

        def _select():
            return self.client.table("analysis_results").select("*").eq("job_id", job_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def add_event(
        self,
        *,
        job_id: str,
        video_id: str,
        event_type: str,
        status: str,
        stage: str,
        progress_percent: int,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        global LOCAL_EVENT_SEQUENCE
        event = {
            "job_id": job_id,
            "video_id": video_id,
            "event_type": event_type,
            "status": status,
            "stage": stage,
            "progress_percent": progress_percent,
            "payload": payload or {},
            "created_at": utc_now_iso(),
        }
        if not self.client:
            LOCAL_EVENT_SEQUENCE += 1
            event["sequence"] = LOCAL_EVENT_SEQUENCE
            LOCAL_EVENTS[job_id].append(event)
            return event

        def _insert():
            return self.client.table("analysis_events").insert(event).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def get_events_after(self, job_id: str, sequence: int) -> list[dict[str, Any]]:
        if not self.client:
            return [event for event in LOCAL_EVENTS.get(job_id, []) if event["sequence"] > sequence]

        def _select():
            return (
                self.client.table("analysis_events")
                .select("*")
                .eq("job_id", job_id)
                .gt("sequence", sequence)
                .order("sequence")
                .execute()
            )

        result = await self._run(_select)
        return result.data or []

    async def download_video(self, object_path: str) -> bytes:
        if not self.client:
            raise RuntimeError("Supabase storage is required for the real upload flow.")

        def _download():
            return self.client.storage.from_(SUPABASE_BUCKET).download(object_path)

        blob = await self._run(_download)
        if isinstance(blob, bytes):
            return blob
        return bytes(blob)

    async def delete_video_object(self, object_path: str) -> None:
        if not self.client or not object_path:
            return

        def _remove():
            return self.client.storage.from_(SUPABASE_BUCKET).remove([object_path])

        try:
            await self._run(_remove)
        except Exception:
            pass


# Singleton instance
repository = Repository()
