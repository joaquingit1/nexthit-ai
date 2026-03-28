from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, HTTPException

from config import SUPABASE_BUCKET
from models import UploadInitRequest, UploadInitResponse
from repository import repository
from utils import utc_now_iso

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/init", response_model=UploadInitResponse)
async def create_upload_ticket(request: UploadInitRequest):
    """Create an upload ticket for a new video."""
    if not repository.configured:
        raise HTTPException(status_code=503, detail="Supabase is not configured on the backend.")
    video_id = f"video-{uuid.uuid4().hex[:12]}"
    safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "-", request.file_name).strip("-") or "upload.mp4"
    object_path = f"{video_id}/{safe_name}"
    now = utc_now_iso()
    await repository.create_video(
        {
            "id": video_id,
            "storage_path": object_path,
            "original_filename": request.file_name,
            "mime_type": request.content_type,
            "size_bytes": request.size_bytes,
            "duration_seconds": None,
            "transcript_text": None,
            "transcript_language": None,
            "transcript_segments": None,
            "status": "pending_upload",
            "created_at": now,
            "updated_at": now,
        }
    )
    return UploadInitResponse(video_id=video_id, bucket=SUPABASE_BUCKET, object_path=object_path)
