from __future__ import annotations

from typing import Any

from utils import clamp, format_timestamp, round_value


def build_viewers_from_personas(personas: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    """Build viewer data from personas for retention graph."""
    viewers = []
    for index, persona in enumerate(personas):
        dropoff_second = clamp(float(persona["dropoff_second"]), 0.8, duration_seconds)
        viewers.append(
            {
                "id": persona["persona_id"],
                "handle": persona["name"].lower().replace(" ", "_"),
                "segment": persona.get("audience_context_label") or persona.get("segment_label") or persona.get("country", "Audiencia"),
                "color": persona["color"],
                "wave": index // 20,
                "points": [
                    {"second": 0, "retention": 100},
                    {"second": round_value(dropoff_second, 1), "retention": 100},
                    {"second": round_value(dropoff_second, 1), "retention": 0},
                    {"second": duration_seconds, "retention": 0},
                ],
                "dropOffSecond": round_value(dropoff_second, 1),
            }
        )
    return viewers


def build_average_line(viewers: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    """Build average retention line from viewers."""
    sample_count = max(duration_seconds * 16, 120)
    line = []
    for index in range(sample_count + 1):
        second = round_value((index / sample_count) * duration_seconds, 2)
        active = sum(1 for viewer in viewers if viewer["dropOffSecond"] > second)
        line.append({"second": second, "retention": round_value((active / max(len(viewers), 1)) * 100, 1)})
    if line:
        line[0]["retention"] = 100
    return line


def find_major_drop_second(points: list[dict[str, Any]]) -> float:
    """Find the second where the biggest drop in retention occurs."""
    strongest_second = 0.0
    strongest_delta = 0.0
    for index in range(1, len(points)):
        delta = points[index - 1]["retention"] - points[index]["retention"]
        if delta > strongest_delta:
            strongest_delta = delta
            strongest_second = points[index]["second"]
    return strongest_second


def build_markers(average_line: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    """Build markers for retention graph."""
    drop_second = find_major_drop_second(average_line)
    return [
        {
            "second": max(1, round_value(drop_second, 1)),
            "retention": 62,
            "label": f"Major drop begins at {format_timestamp(drop_second)}",
            "detail": "The promise is still arriving after the most fragile swipe window.",
        },
        {
            "second": round_value(min(duration_seconds - 6, max(3, duration_seconds * 0.42)), 1),
            "retention": 66,
            "label": "Mid-video proof becomes clearer",
            "detail": "The audience responds better when the creative stops explaining and starts proving.",
        },
        {
            "second": round_value(max(1, duration_seconds - 3), 1),
            "retention": 32,
            "label": "CTA lands after attention softens",
            "detail": "The ask needs to appear while more of the audience is still engaged.",
        },
    ]


def build_platform_fit_rows(best_platform: str, creative_context: dict[str, Any]) -> list[dict[str, Any]]:
    """Build platform fit rows from creative context."""
    scores = {
        "TikTok": int(clamp(round_value(creative_context["hook_score"] * 0.36 + creative_context["pacing_score"] * 0.3 + creative_context["novelty_score"] * 0.34), 0, 100)),
        "Instagram Reels": int(clamp(round_value(creative_context["visual_score"] * 0.3 + creative_context["clarity_score"] * 0.22 + creative_context["hook_score"] * 0.24 + creative_context["pacing_score"] * 0.24), 0, 100)),
        "YouTube Shorts": int(clamp(round_value(creative_context["hook_score"] * 0.27 + creative_context["clarity_score"] * 0.21 + creative_context["audio_score"] * 0.22 + creative_context["pacing_score"] * 0.3), 0, 100)),
        "LinkedIn": int(clamp(round_value(creative_context["clarity_score"] * 0.32 + creative_context["audio_score"] * 0.24 + creative_context["cta_score"] * 0.16 + creative_context["platform_fit_score"] * 0.28), 0, 100)),
    }
    rows = []
    for platform, fit in scores.items():
        rows.append(
            {
                "platform": platform,
                "fit": fit,
                "tag": "Mejor encaje actual" if platform == best_platform else "Encaje secundario",
                "verdict": f"{platform} encaja mejor con la estructura actual." if platform == best_platform else f"{platform} mejora si el hook es mas rapido y el payoff mas claro.",
                "adaptations": [
                    "Empeza con una promesa mas clara en el primer frame.",
                    "Lleva la prueba mas arriba dentro de la edicion.",
                    "Mantene la llamada a la accion alineada con la promesa inicial.",
                ],
            }
        )
    return sorted(rows, key=lambda item: item["fit"], reverse=True)
