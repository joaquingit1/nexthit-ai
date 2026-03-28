from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import httpx

from config import GROQ_API_KEY, GROQ_BASE_URL
from services.ffmpeg import guess_transcription_content_type, maybe_prepare_audio_for_transcription
from system_prompts import TRANSCRIPTION_SPEC
from utils import clamp, round_value


def build_transcript_segments(text: str, duration_seconds: int) -> list[dict[str, Any]]:
    """Build transcript segments from text."""
    normalized = re.sub(r"\s+", " ", text).strip()
    source = normalized or "Analizamos el clip como lo haria una audiencia real, predecimos la retencion y convertimos el resultado en una estrategia de crecimiento."
    sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", source) if sentence.strip()] or [source]
    segment_count = max(1, min(len(sentences), 6))
    slice_duration = duration_seconds / segment_count
    return [
        {
            "start": round_value(index * slice_duration, 2),
            "end": round_value(min(duration_seconds, (index + 1) * slice_duration), 2),
            "text": sentences[index] if index < len(sentences) else sentences[-1],
        }
        for index in range(segment_count)
    ]


def normalize_transcript_segments(
    segments: list[dict[str, Any]],
    text: str,
    duration_seconds: int,
) -> list[dict[str, Any]]:
    """Normalize transcript segments to ensure valid time ranges."""
    safe_duration = max(duration_seconds, 1)
    normalized: list[dict[str, Any]] = []

    for segment in segments:
        raw_text = str(segment.get("text", "")).strip()
        if not raw_text:
            continue
        start = round_value(clamp(float(segment.get("start", 0) or 0), 0, safe_duration), 2)
        end = round_value(clamp(float(segment.get("end", start) or start), start, safe_duration), 2)
        if end <= start:
            end = round_value(min(safe_duration, start + 0.2), 2)
        normalized.append({"start": start, "end": end, "text": raw_text})

    return normalized or build_transcript_segments(text, duration_seconds)


def make_fallback_transcript(duration_seconds: int, error_message: str | None = None) -> dict[str, Any]:
    """Create fallback transcript when transcription fails."""
    text = (
        "Speech transcription was unavailable for this clip. Continue with limited transcript context "
        "until audio or multimodal extraction succeeds."
    )
    return {
        "text": text,
        "language": "unknown",
        "segments": build_transcript_segments(text, duration_seconds),
        "source": "fallback",
        "error": error_message,
    }


async def transcribe_video_with_whisper(file_path: str, user_context: str, duration_seconds: int) -> dict[str, Any]:
    """Transcribe video using Groq Whisper API."""
    if not GROQ_API_KEY:
        return make_fallback_transcript(duration_seconds, "GROQ_API_KEY is not configured.")

    transcription_path, temporary_audio_path = maybe_prepare_audio_for_transcription(file_path)
    try:
        content_type = guess_transcription_content_type(transcription_path)
        with open(transcription_path, "rb") as media_file:
            media_bytes = media_file.read()

        model = os.getenv(TRANSCRIPTION_SPEC.model_env_var, TRANSCRIPTION_SPEC.default_model)

        async with httpx.AsyncClient(timeout=TRANSCRIPTION_SPEC.timeout_seconds) as client:
            response = await client.post(
                f"{GROQ_BASE_URL}/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                data={
                    "model": model,
                    "response_format": TRANSCRIPTION_SPEC.response_format,
                    "timestamp_granularities[]": "segment",
                },
                files={"file": (Path(transcription_path).name, media_bytes, content_type)},
            )
        response.raise_for_status()
        payload = response.json()
        transcript_text = str(payload.get("text", "")).strip()
        segments = normalize_transcript_segments(
            [
                {
                    "start": round_value(segment.get("start", 0), 2),
                    "end": round_value(segment.get("end", 0), 2),
                    "text": segment.get("text", "").strip(),
                }
                for segment in payload.get("segments", [])
                if segment.get("text")
            ],
            transcript_text,
            duration_seconds,
        )
        if not transcript_text:
            return make_fallback_transcript(duration_seconds, "Groq returned an empty transcript.")
        return {
            "text": transcript_text,
            "language": payload.get("language", "en"),
            "segments": segments,
            "source": "groq",
            "error": None,
        }
    except Exception as exc:
        print(f"Groq transcription failed for {Path(file_path).name}: {exc}")
        return make_fallback_transcript(duration_seconds, str(exc))
    finally:
        if temporary_audio_path and os.path.exists(temporary_audio_path):
            try:
                os.unlink(temporary_audio_path)
            except OSError:
                pass
