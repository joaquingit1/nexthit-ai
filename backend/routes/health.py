from __future__ import annotations

from fastapi import APIRouter

from config import GEMINI_API_KEY, GEMINI_VIDEO_MODEL, GROQ_API_KEY, GROQ_TEXT_MODEL, SUPABASE_BUCKET
from repository import repository
from system_prompts import TRANSCRIPTION_SPEC

router = APIRouter()


@router.get("/")
async def read_root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Backend listo para subidas a Supabase, transcripcion con Whisper, streaming de personas y sintesis final del analisis.",
        "supabase_configured": repository.configured,
        "groq_configured": bool(GROQ_API_KEY),
        "gemini_configured": bool(GEMINI_API_KEY),
        "groq_transcription_model": TRANSCRIPTION_SPEC.default_model,
        "groq_text_model": GROQ_TEXT_MODEL,
        "gemini_video_model": GEMINI_VIDEO_MODEL,
        "text_provider": "groq",
        "video_provider": "gemini",
        "bucket": SUPABASE_BUCKET,
    }
