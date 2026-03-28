from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from constants import LEAVE_REASON_LABELS
from utils import round_value


def median(values: list[float]) -> float:
    """Calculate median of a list of values."""
    if not values:
        return 0.0
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return float(ordered[midpoint])
    return float((ordered[midpoint - 1] + ordered[midpoint]) / 2)


def build_distribution_from_scalar(personas: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    """Build distribution from a scalar persona attribute."""
    grouped: dict[str, list[float]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona[key])].append(float(persona["retention_percent"]))
    rows = [
        {
            "label": label,
            "percentage": round_value((len(retentions) / max(len(personas), 1)) * 100, 1),
            "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
        }
        for label, retentions in grouped.items()
    ]
    rows.sort(key=lambda item: (-item["percentage"], -item["averageRetention"]))
    return rows


def build_distribution_from_list(personas: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    """Build distribution from a list persona attribute."""
    grouped: dict[str, list[float]] = defaultdict(list)
    for persona in personas:
        for label in persona.get(key, []):
            grouped[str(label)].append(float(persona["retention_percent"]))
    rows = [
        {
            "label": label,
            "percentage": round_value((len(retentions) / max(len(personas), 1)) * 100, 1),
            "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
        }
        for label, retentions in grouped.items()
    ]
    rows.sort(key=lambda item: (-item["averageRetention"], -item["percentage"]))
    return rows[:8]


def build_persona_segments(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build persona segments from personas list."""
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona["segment_label"])].append(persona)

    segments = []
    for label, items in grouped.items():
        retentions = [float(item["retention_percent"]) for item in items]
        dropoffs = [float(item["dropoff_second"]) for item in items]
        reason_counts = Counter(str(item.get("reason_code", "unclear_value")) for item in items)
        dominant_reason_code = reason_counts.most_common(1)[0][0]
        sample = items[0]
        segments.append(
            {
                "label": label,
                "archetype": sample.get("archetype"),
                "demographicCluster": sample.get("demographic_cluster"),
                "support": len(items),
                "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
                "medianDropoffSecond": round_value(median(dropoffs), 1),
                "dominantReasonCode": dominant_reason_code,
                "dominantReasonLabel": LEAVE_REASON_LABELS.get(dominant_reason_code, dominant_reason_code),
                "samplePersonas": [item["name"] for item in items[:2]],
                "sampleEvidence": [
                    {
                        "name": item["name"],
                        "dropoffSecond": item["dropoff_second"],
                        "reasonLabel": item.get("reason_label"),
                        "evidenceExcerpt": item.get("evidence_excerpt"),
                    }
                    for item in items[:2]
                ],
            }
        )
    segments.sort(key=lambda item: (-item["averageRetention"], item["medianDropoffSecond"]))
    return segments


def build_segment_diagnoses(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build segment diagnoses from personas."""
    diagnoses = []
    for segment in build_persona_segments(personas):
        matching = [persona for persona in personas if persona["segment_label"] == segment["label"]]
        if not matching:
            continue
        dominant_reason_code = segment["dominantReasonCode"]
        diagnoses.append(
            {
                "label": segment["label"],
                "dropoffSecond": segment["medianDropoffSecond"],
                "reasonCode": dominant_reason_code,
                "reasonLabel": segment["dominantReasonLabel"],
                "why": Counter(persona["why_they_left"] for persona in matching).most_common(1)[0][0],
                "examples": [
                    {
                        "name": item["name"],
                        "dropoffSecond": item["dropoff_second"],
                        "reasonLabel": item.get("reason_label"),
                        "evidenceExcerpt": item.get("evidence_excerpt"),
                    }
                    for item in sorted(matching, key=lambda persona: persona["retention_percent"], reverse=True)[:2]
                ],
            }
        )
    diagnoses.sort(key=lambda item: item["dropoffSecond"])
    return diagnoses


def build_top_leave_reasons(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build top leave reasons from personas."""
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona.get("reason_code", "unclear_value"))].append(persona)

    rows = []
    for reason_code, items in grouped.items():
        rows.append(
            {
                "reasonCode": reason_code,
                "reasonLabel": LEAVE_REASON_LABELS.get(reason_code, reason_code),
                "count": len(items),
                "averageDropoffSecond": round_value(sum(float(item["dropoff_second"]) for item in items) / max(len(items), 1), 1),
                "example": Counter(item["why_they_left"] for item in items).most_common(1)[0][0],
                "evidenceExcerpt": Counter(str(item.get("evidence_excerpt", "")) for item in items if item.get("evidence_excerpt")).most_common(1)[0][0]
                if any(item.get("evidence_excerpt") for item in items)
                else "",
            }
        )
    rows.sort(key=lambda item: (-item["count"], item["averageDropoffSecond"]))
    return rows[:3]


def aggregate_target_audience(personas: list[dict[str, Any]]) -> dict[str, Any]:
    """Aggregate target audience from personas."""
    segments = build_persona_segments(personas)
    primary = segments[0] if segments else None
    secondary = segments[1] if len(segments) > 1 else None
    return {
        "primaryAudience": primary["label"] if primary else "Gen Z scroller veloz",
        "secondaryAudience": secondary["label"] if secondary else "Audiencia de nicho de alta intencion",
        "countries": build_distribution_from_scalar(personas, "country"),
        "ageRanges": build_distribution_from_scalar(personas, "age_range"),
        "interests": build_distribution_from_list(personas, "interests"),
        "hobbies": build_distribution_from_list(personas, "hobbies"),
        "socialStatus": build_distribution_from_scalar(personas, "social_status"),
        "incomeBrackets": build_distribution_from_scalar(personas, "income_bracket"),
        "personaSegments": segments,
    }
