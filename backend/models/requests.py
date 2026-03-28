from __future__ import annotations

from pydantic import BaseModel


class UploadInitRequest(BaseModel):
    file_name: str
    content_type: str | None = None
    size_bytes: int | None = None


class CreateJobRequest(BaseModel):
    video_id: str
    storage_path: str
    user_context: str = ""
    preferred_platform: str | None = None
