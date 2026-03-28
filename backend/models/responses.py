from __future__ import annotations

from pydantic import BaseModel


class UploadInitResponse(BaseModel):
    video_id: str
    bucket: str
    object_path: str


class JobEnvelope(BaseModel):
    job_id: str
    video_id: str
    status: str
    stage: str
    progress_percent: int
    events_url: str
    result_url: str
    error_message: str | None = None
