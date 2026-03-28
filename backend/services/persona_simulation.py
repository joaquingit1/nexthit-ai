from __future__ import annotations

import json
import random
from typing import Any

from config import resolve_prompt_model
from constants import (
    LEAVE_REASON_LABELS,
    PERSONA_ARCHETYPES,
    PERSONA_COLOR_PALETTE,
    PERSONA_DEMOGRAPHIC_PROFILES,
    PERSONA_FRUSTRATIONS,
    PERSONA_HOBBIES,
    PERSONA_INTERESTS,
    PERSONA_LAST_NAME_SEEDS,
    PERSONA_MOTIVATIONS,
    PERSONA_NAME_SEEDS,
    PERSONA_OCCUPATIONS,
)
from schemas import persona_batch_schema
from services.groq_client import call_groq_chat_json
from system_prompts import build_persona_batch_spec_with_override
from utils import clamp, round_value


def build_persona_library() -> list[dict[str, Any]]:
    """Build the library of 100 synthetic personas."""
    personas: list[dict[str, Any]] = []
    for archetype_index, archetype in enumerate(PERSONA_ARCHETYPES):
        for profile_index, profile in enumerate(PERSONA_DEMOGRAPHIC_PROFILES):
            index = archetype_index * len(PERSONA_DEMOGRAPHIC_PROFILES) + profile_index
            first_name = PERSONA_NAME_SEEDS[index % len(PERSONA_NAME_SEEDS)]
            last_name = PERSONA_LAST_NAME_SEEDS[(index // len(PERSONA_NAME_SEEDS)) % len(PERSONA_LAST_NAME_SEEDS)]
            personas.append(
                {
                    "persona_id": f"persona-{index + 1}",
                    "name": f"{first_name} {last_name}",
                    "archetype": archetype,
                    "demographic_profile_id": profile["id"],
                    "demographic_profile_label": profile["label"],
                    "demographic_cluster": profile["cluster"],
                    "age_range": profile["age_range"],
                    "country": profile["country"],
                    "occupation": PERSONA_OCCUPATIONS[(archetype_index + profile_index) % len(PERSONA_OCCUPATIONS)],
                    "income_bracket": profile["income_bracket"],
                    "social_status": profile["social_status"],
                    "interests": PERSONA_INTERESTS[(archetype_index + profile_index) % len(PERSONA_INTERESTS)],
                    "hobbies": PERSONA_HOBBIES[(archetype_index + profile_index) % len(PERSONA_HOBBIES)],
                    "life_story": f"{archetype}. Consume short-form y decide en segundos si el video merece atención.",
                    "platform_habits": "Principalmente consume Instagram Reels y TikTok en pausas cortas del día.",
                    "motivations": PERSONA_MOTIVATIONS[archetype_index % len(PERSONA_MOTIVATIONS)],
                    "frustrations": PERSONA_FRUSTRATIONS[profile_index % len(PERSONA_FRUSTRATIONS)],
                    "segment_label": f"{profile['cluster']} {archetype}",
                    "color": PERSONA_COLOR_PALETTE[archetype_index % len(PERSONA_COLOR_PALETTE)],
                }
            )
    return personas


# Pre-built persona library
PERSONA_LIBRARY = build_persona_library()


def default_persona_reason(
    persona: dict[str, Any],
    creative_context: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    """Generate default persona drop-off reason based on archetype."""
    rng = random.Random(f"{persona['persona_id']}::{creative_context['overall_score']}::{creative_context['hook_score']}")
    first_hook = clamp(
        creative_context["hook_score"] * 0.035 + creative_context["clarity_score"] * 0.028 + creative_context["pacing_score"] * 0.025,
        0.8,
        duration_seconds,
    )
    archetype = persona.get("archetype", "")
    reason_code = "intro_too_slow"
    base = first_hook + rng.uniform(-0.7, 0.8)

    if archetype == "Scroller veloz":
        base -= 1.3
        reason_code = "intro_too_slow"
    elif archetype == "Cazador de tendencias":
        base -= 0.7
        reason_code = "low_novelty"
    elif archetype == "Buscador de valor":
        base += 0.2
        reason_code = "unclear_value"
    elif archetype == "Comprador esceptico":
        base += 0.3
        reason_code = "claim_lacks_proof"
    elif archetype == "Entusiasta de nicho":
        base += 0.6
        reason_code = "irrelevant_for_audience"
    elif archetype == "Entretenido casual":
        base -= 0.4
        reason_code = "low_energy"
    elif archetype == "Comprador problema-solucion":
        base += 0.9
        reason_code = "unclear_value"
    elif archetype == "Creador o marketer":
        base += 0.5
        reason_code = "weak_visual_hook"
    elif archetype == "Comprador impulsivo":
        base -= 0.2
        reason_code = "cta_too_late"
    elif archetype == "Viewer guiado por historia":
        base += 0.8
        reason_code = "weak_story_payoff"

    if persona.get("age_range") == "18-24":
        base -= 0.4
    if persona.get("social_status") == "Dueno de negocio":
        base += 0.5
    if creative_context["cta_score"] < 60 and archetype in {"Comprador impulsivo", "Comprador problema-solucion"}:
        reason_code = "cta_too_late"
        base -= 0.2
    if creative_context["clarity_score"] < 68 and archetype in {"Buscador de valor", "Comprador problema-solucion"}:
        reason_code = "unclear_value"
        base -= 0.3
    if creative_context["novelty_score"] < 62 and archetype in {"Cazador de tendencias", "Entretenido casual"}:
        reason_code = "low_novelty"
        base -= 0.4
    if creative_context["audio_score"] < 60:
        reason_code = "too_much_talking"

    dropoff_second = round_value(clamp(base, 0.8, duration_seconds), 1)
    retention_percent = int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100))
    reason_label = LEAVE_REASON_LABELS.get(reason_code, "Motivo no clasificado")
    left_because = f"{reason_label}. {persona['name']} siente que el video no resuelve su expectativa a tiempo."
    interaction = (
        f"{persona['name']} corta cerca de {dropoff_second}s porque identifica {reason_label.lower()}."
        if retention_percent < 85
        else f"{persona['name']} se queda hasta {dropoff_second}s; aun así detecta {reason_label.lower()} como el principal punto de fricción."
    )
    return {
        "dropoff_second": dropoff_second,
        "retention_percent": retention_percent,
        "reason_code": reason_code,
        "reason_label": reason_label,
        "why_they_left": left_because,
        "summary_of_interacion": interaction,
    }


async def analyze_persona_batch(
    batch: list[dict[str, Any]],
    creative_context: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> list[dict[str, Any]]:
    """Analyze a batch of personas using Groq LLM."""
    fallback_results = [{**persona, **default_persona_reason(persona, creative_context, duration_seconds)} for persona in batch]
    try:
        spec = build_persona_batch_spec_with_override(LEAVE_REASON_LABELS.keys())
        response = await call_groq_chat_json(
            messages=[
                {
                    "role": "system",
                    "content": spec.system_prompt,
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "duration_seconds": duration_seconds,
                            "transcript": transcript,
                            "reason_taxonomy": LEAVE_REASON_LABELS,
                            "creative_context": {
                                "hook_score": creative_context["hook_score"],
                                "clarity_score": creative_context["clarity_score"],
                                "pacing_score": creative_context["pacing_score"],
                                "cta_score": creative_context["cta_score"],
                                "best_platform": creative_context["best_platform"],
                                "primary_angle": creative_context["primary_angle"],
                                "timeline_insights": creative_context["timeline_insights"],
                            },
                            "personas": batch,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name=spec.schema_name,
            schema=persona_batch_schema(),
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
        )
        if not response or "personas" not in response:
            return fallback_results
        mapped = {item.get("persona_id"): item for item in response.get("personas", []) if isinstance(item, dict) and item.get("persona_id")}
        normalized = []
        for persona in batch:
            base = default_persona_reason(persona, creative_context, duration_seconds)
            result = mapped.get(persona["persona_id"], {})
            dropoff_second = round_value(clamp(float(result.get("dropoff_second", base["dropoff_second"])), 0.8, duration_seconds), 1)
            normalized.append(
                {
                    **persona,
                    "dropoff_second": dropoff_second,
                    "retention_percent": int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100)),
                    "reason_code": str(result.get("reason_code", base["reason_code"])).strip(),
                    "reason_label": LEAVE_REASON_LABELS.get(str(result.get("reason_code", base["reason_code"])).strip(), base["reason_label"]),
                    "why_they_left": str(result.get("why_they_left", base["why_they_left"])).strip(),
                    "summary_of_interacion": str(result.get("summary_of_interacion", base["summary_of_interacion"])).strip(),
                }
            )
        return normalized
    except Exception:
        return fallback_results
