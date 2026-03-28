from __future__ import annotations

import re
from typing import Any

from utils import clamp, round_value

CTA_PATTERNS = [
    "compra",
    "comprá",
    "shop",
    "buy",
    "link",
    "haz clic",
    "click",
    "registrate",
    "regístrate",
    "suscribite",
    "suscríbete",
    "seguinos",
    "follow",
    "descargá",
    "descarga",
    "escribinos",
    "mandanos",
    "agenda",
    "reservá",
    "reserva",
]

HOOK_PATTERNS = [
    "mira",
    "mirá",
    "ojo",
    "stop",
    "espera",
    "esperá",
    "nunca",
    "jamas",
    "antes de",
    "no hagas",
    "if you",
    "esto",
    "esta",
    "this",
]

BENEFIT_PATTERNS = [
    "ahorra",
    "gana",
    "mejora",
    "crece",
    "resultado",
    "beneficio",
    "soluciona",
    "resuelve",
    "mas rapido",
    "más rápido",
    "fácil",
    "facil",
    "mejor",
]

PROOF_PATTERNS = [
    "prueba",
    "demostr",
    "mira como",
    "asi se ve",
    "así se ve",
    "resultado",
    "caso real",
    "ejemplo",
    "antes y despues",
    "antes y después",
    "review",
    "testimonio",
]


def compact_excerpt(text: str, max_words: int = 12) -> str:
    normalized = re.sub(r"\s+", " ", text or "").strip()
    if not normalized:
        return ""
    words = normalized.split(" ")
    if len(words) <= max_words:
        return normalized
    return " ".join(words[:max_words]).rstrip(" ,.;:") + "..."


def segment_matches(text: str, patterns: list[str]) -> bool:
    lowered = text.lower()
    return any(pattern in lowered for pattern in patterns)


def stage_from_second(second: float, duration_seconds: int, cta_second: float | None = None) -> str:
    safe_duration = max(duration_seconds, 1)
    second = clamp(second, 0, safe_duration)
    if cta_second is not None and abs(second - cta_second) <= 1.4:
        return "cta"
    ratio = second / safe_duration
    if ratio <= 0.18:
        return "hook"
    if ratio <= 0.5:
        return "desarrollo"
    if ratio <= 0.78:
        return "prueba"
    if ratio <= 0.92:
        return "cta"
    return "cierre"


def derive_transcript_signals(transcript: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
    segments = []
    for segment in transcript.get("segments", []):
        text = re.sub(r"\s+", " ", str(segment.get("text", "") or "")).strip()
        if not text:
            continue
        start = round_value(float(segment.get("start", 0) or 0), 2)
        end = round_value(float(segment.get("end", start) or start), 2)
        duration = max(end - start, 0.2)
        words = len(text.split())
        words_per_second = round_value(words / duration, 2)
        tags: list[str] = []
        if segment_matches(text, HOOK_PATTERNS):
            tags.append("hook")
        if segment_matches(text, BENEFIT_PATTERNS):
            tags.append("benefit")
        if segment_matches(text, PROOF_PATTERNS):
            tags.append("proof")
        if segment_matches(text, CTA_PATTERNS):
            tags.append("cta")
        if words_per_second >= 3.4 or words >= 18:
            tags.append("overload")
        segments.append(
            {
                "start": start,
                "end": end,
                "text": text,
                "excerpt": compact_excerpt(text),
                "words": words,
                "words_per_second": words_per_second,
                "tags": tags,
            }
        )

    first_speech_time = round_value(float(segments[0]["start"]), 1) if segments else 0.0
    cta_moments = [segment for segment in segments if "cta" in segment["tags"]]
    cta_second = round_value(float(cta_moments[0]["start"]), 1) if cta_moments else None

    for segment in segments:
        segment["stage"] = stage_from_second(float(segment["start"]), duration_seconds, cta_second)

    return {
        "first_speech_time": first_speech_time,
        "hook_moments": [segment for segment in segments if "hook" in segment["tags"]] or segments[:2],
        "benefit_moments": [segment for segment in segments if "benefit" in segment["tags"]],
        "proof_moments": [segment for segment in segments if "proof" in segment["tags"]],
        "cta_moments": cta_moments,
        "overload_moments": [segment for segment in segments if "overload" in segment["tags"]],
        "segments": segments,
    }


def find_nearest_segment(
    transcript_signals: dict[str, Any],
    second: float,
    *,
    preferred_tag: str | None = None,
) -> dict[str, Any] | None:
    segments = transcript_signals.get("segments", [])
    if not segments:
        return None
    candidates = segments
    if preferred_tag:
        tagged = [segment for segment in segments if preferred_tag in segment.get("tags", [])]
        if tagged:
            candidates = tagged
    return min(candidates, key=lambda item: abs(float(item["start"]) - second))


def pick_primary_moment(transcript_signals: dict[str, Any], key: str) -> dict[str, Any] | None:
    moments = transcript_signals.get(key, [])
    return moments[0] if moments else None

