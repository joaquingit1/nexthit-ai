from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any

from constants import LEAVE_REASON_LABELS
from utils import round_value


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return float(ordered[midpoint])
    return float((ordered[midpoint - 1] + ordered[midpoint]) / 2)


def persona_weight(persona: dict[str, Any]) -> float:
    weighted = persona.get("weighted_retention_score")
    if weighted is not None:
        return float(weighted)
    retention = float(persona.get("retention_percent", 0))
    multiplier = float(persona.get("language_affinity_multiplier", 1))
    return retention * multiplier


def build_weighted_scalar_breakdown(
    personas: list[dict[str, Any]],
    key: str,
    *,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"score": 0.0, "retention": 0.0, "support": 0})
    total_score = 0.0
    for persona in personas:
        label = str(persona.get(key, "")).strip()
        if not label:
            continue
        score = persona_weight(persona)
        grouped[label]["score"] += score
        grouped[label]["retention"] += float(persona.get("retention_percent", 0))
        grouped[label]["support"] += 1
        total_score += score

    rows = [
        {
            "label": label,
            "percentage": round_value((stats["score"] / max(total_score, 1.0)) * 100, 1),
            "averageRetention": round_value(stats["retention"] / max(stats["support"], 1), 1),
            "support": int(stats["support"]),
        }
        for label, stats in grouped.items()
    ]
    rows.sort(key=lambda item: (-item["percentage"], -item["averageRetention"], item["label"]))
    return rows[:limit] if limit else rows


def build_weighted_list_breakdown(
    personas: list[dict[str, Any]],
    key: str,
    *,
    minimum_support: int = 5,
    limit: int = 8,
) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"score": 0.0, "retention": 0.0, "support": 0})
    total_score = 0.0
    for persona in personas:
        labels = [str(label).strip() for label in persona.get(key, []) if str(label).strip()]
        for label in labels:
            score = persona_weight(persona)
            grouped[label]["score"] += score
            grouped[label]["retention"] += float(persona.get("retention_percent", 0))
            grouped[label]["support"] += 1
            total_score += score

    rows = [
        {
            "label": label,
            "percentage": round_value((stats["score"] / max(total_score, 1.0)) * 100, 1),
            "averageRetention": round_value(stats["retention"] / max(stats["support"], 1), 1),
            "support": int(stats["support"]),
        }
        for label, stats in grouped.items()
        if stats["support"] >= minimum_support
    ]
    rows.sort(key=lambda item: (-item["percentage"], -item["averageRetention"], item["label"]))
    return rows[:limit]


def build_top_composite_audiences(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, dict[str, float]] = defaultdict(lambda: {"score": 0.0, "retention": 0.0, "support": 0})
    for persona in personas:
        label = f"{persona.get('gender', 'Audiencia')} de {persona.get('age_range', '')} en {persona.get('country', '')}".strip()
        score = persona_weight(persona)
        grouped[label]["score"] += score
        grouped[label]["retention"] += float(persona.get("retention_percent", 0))
        grouped[label]["support"] += 1

    rows = [
        {
            "label": label,
            "weightedScore": round_value(stats["score"], 1),
            "averageRetention": round_value(stats["retention"] / max(stats["support"], 1), 1),
            "support": int(stats["support"]),
        }
        for label, stats in grouped.items()
        if stats["support"] >= 3
    ]
    rows.sort(key=lambda item: (-item["weightedScore"], -item["averageRetention"], item["label"]))
    return rows


def build_audience_summary(target_audience: dict[str, Any]) -> str:
    gender = target_audience.get("genderBreakdown", [{}])[0].get("label", "la audiencia principal")
    age = target_audience.get("ageBreakdown", [{}])[0].get("label", "25-34")
    country = target_audience.get("countryBreakdown", [{}])[0].get("label", "mercados compatibles")
    hobby = target_audience.get("topHobbies", [{}])[0].get("label")
    niche = target_audience.get("topNiches", [{}])[0].get("label")
    summary = f"La mejor respuesta aparece en {gender.lower()} de {age}, con mayor proyeccion en {country}."
    if hobby:
        summary += f" El hobby que mas coincide con la retencion es {hobby}."
    if niche:
        summary += f" El nicho con mejor ajuste hoy es {niche}."
    return summary


def build_audience_diagnoses(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups = [
        ("Genero", "gender", build_weighted_scalar_breakdown(personas, "gender", limit=3)),
        ("Edad", "age_range", build_weighted_scalar_breakdown(personas, "age_range", limit=4)),
        ("Pais", "country", build_weighted_scalar_breakdown(personas, "country", limit=4)),
    ]
    diagnoses: list[dict[str, Any]] = []
    for group_name, field, rows in groups:
        for row in rows:
            matching = [persona for persona in personas if str(persona.get(field, "")) == row["label"]]
            if not matching:
                continue
            dominant_reason_code = Counter(str(item.get("reason_code", "unclear_value")) for item in matching).most_common(1)[0][0]
            diagnoses.append(
                {
                    "label": f"{group_name}: {row['label']}",
                    "dropoffSecond": round_value(median([float(item.get("dropoff_second", 0)) for item in matching]), 1),
                    "reasonCode": dominant_reason_code,
                    "reasonLabel": LEAVE_REASON_LABELS.get(dominant_reason_code, dominant_reason_code),
                    "why": Counter(item.get("why_they_left", "") for item in matching).most_common(1)[0][0],
                    "examples": [
                        {
                            "name": item.get("name"),
                            "dropoffSecond": item.get("dropoff_second"),
                            "reasonLabel": item.get("reason_label"),
                            "evidenceExcerpt": item.get("evidence_excerpt"),
                        }
                        for item in sorted(matching, key=lambda persona: persona_weight(persona), reverse=True)[:2]
                    ],
                }
            )
    return diagnoses[:8]


def build_top_leave_reasons(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
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
    gender_breakdown = build_weighted_scalar_breakdown(personas, "gender", limit=3)
    country_breakdown = build_weighted_scalar_breakdown(personas, "country", limit=6)
    age_breakdown = build_weighted_scalar_breakdown(personas, "age_range", limit=7)
    top_hobbies = build_weighted_list_breakdown(personas, "hobbies", minimum_support=5, limit=6)
    top_niches = build_weighted_list_breakdown(personas, "niche_tags", minimum_support=5, limit=6)
    top_audiences = build_top_composite_audiences(personas)
    primary = top_audiences[0]["label"] if top_audiences else "Mujer de 25-34 en mercados hispanohablantes"
    secondary = top_audiences[1]["label"] if len(top_audiences) > 1 else "Hombre de 25-34 con alta afinidad al formato"

    payload = {
        "primaryAudience": primary,
        "secondaryAudience": secondary,
        "audienceSummary": "",
        "genderBreakdown": gender_breakdown,
        "countryBreakdown": country_breakdown,
        "ageBreakdown": age_breakdown,
        "topHobbies": top_hobbies,
        "topNiches": top_niches,
        "countries": country_breakdown,
        "ageRanges": age_breakdown,
        "hobbies": top_hobbies,
        "interests": top_niches,
        "socialStatus": build_weighted_scalar_breakdown(personas, "social_status", limit=5),
        "incomeBrackets": build_weighted_scalar_breakdown(personas, "income_bracket", limit=6),
        "personaSegments": [],
    }
    payload["audienceSummary"] = build_audience_summary(payload)
    return payload
