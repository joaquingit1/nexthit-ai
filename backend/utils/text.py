from __future__ import annotations

import re


def strip_json_wrappers(text: str) -> str:
    """Remove markdown code block wrappers from JSON text."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def summary_has_placeholder_text(text: str) -> bool:
    """Check if summary text contains placeholder markers."""
    normalized = re.sub(r"\s+", " ", text or "").strip().lower()
    if not normalized:
        return True
    markers = [
        "speech transcription was unavailable",
        "limited transcript context",
        "demo mode is active",
        "sample keeps the full result experience",
        "fallback",
        "placeholder",
        "uploaded clip",
    ]
    if any(marker in normalized for marker in markers):
        return True
    return len(normalized.split()) < 18
