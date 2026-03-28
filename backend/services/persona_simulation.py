from __future__ import annotations

import json
import random
from collections import Counter
from statistics import pstdev
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
from schemas import persona_batch_compact_schema
from services.groq_client import call_groq_chat_json
from services.transcript_signals import (
    derive_transcript_signals,
    pick_primary_moment,
    stage_from_second,
)
from system_prompts import build_persona_batch_spec
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


PERSONA_LIBRARY = build_persona_library()


def persona_seed(persona: dict[str, Any]) -> int:
    return sum(ord(char) for char in str(persona.get("persona_id", "")) + str(persona.get("name", "")))


def pick_segment_for_persona(
    candidates: list[dict[str, Any]],
    persona: dict[str, Any],
    anchor_second: float,
) -> dict[str, Any] | None:
    if not candidates:
        return None
    ordered = sorted(
        candidates,
        key=lambda item: (
            abs(float(item.get("start", 0)) - anchor_second),
            float(item.get("start", 0)),
        ),
    )
    window = ordered[: min(3, len(ordered))]
    if not window:
        return None
    return window[persona_seed(persona) % len(window)]


def build_compact_persona_prompt_payload(
    *,
    batch: list[dict[str, Any]],
    creative_context: dict[str, Any],
    transcript: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    compact_personas = []
    for persona in batch:
        compact_personas.append(
            {
                "persona_id": persona["persona_id"],
                "name": persona["name"],
                "archetype": persona["archetype"],
                "demographic": persona.get("demographic_profile_label") or persona.get("demographic_cluster"),
                "age_range": persona["age_range"],
                "country": persona["country"],
                "income_bracket": persona["income_bracket"],
                "social_status": persona["social_status"],
                "interest": (persona.get("interests") or [""])[0],
                "hobby": (persona.get("hobbies") or [""])[0],
                "motivation": (persona.get("motivations") or [""])[0],
                "frustration": (persona.get("frustrations") or [""])[0],
            }
        )

    beats = []
    for segment in transcript_signals.get("segments", [])[:6]:
        beats.append(
            {
                "start": round_value(float(segment.get("start", 0)), 1),
                "end": round_value(float(segment.get("end", segment.get("start", 0))), 1),
                "stage": segment.get("stage"),
                "tags": segment.get("tags", [])[:3],
                "excerpt": str(segment.get("excerpt", "")),
            }
        )

    return {
        "duration_seconds": duration_seconds,
        "transcript_text": str(transcript.get("text", ""))[:700],
        "beats": beats,
        "signal_summary": {
            "first_speech_time": round_value(float(transcript_signals.get("first_speech_time", 0) or 0), 1),
            "hook_second": round_value(float(pick_primary_moment(transcript_signals, "hook_moments")["start"]), 1)
            if pick_primary_moment(transcript_signals, "hook_moments")
            else None,
            "benefit_second": round_value(float(pick_primary_moment(transcript_signals, "benefit_moments")["start"]), 1)
            if pick_primary_moment(transcript_signals, "benefit_moments")
            else None,
            "proof_second": round_value(float(pick_primary_moment(transcript_signals, "proof_moments")["start"]), 1)
            if pick_primary_moment(transcript_signals, "proof_moments")
            else None,
            "cta_second": round_value(float(pick_primary_moment(transcript_signals, "cta_moments")["start"]), 1)
            if pick_primary_moment(transcript_signals, "cta_moments")
            else None,
        },
        "reason_taxonomy": LEAVE_REASON_LABELS,
        "creative_context": {
            "hook_score": creative_context["hook_score"],
            "clarity_score": creative_context["clarity_score"],
            "pacing_score": creative_context["pacing_score"],
            "audio_score": creative_context["audio_score"],
            "visual_score": creative_context["visual_score"],
            "novelty_score": creative_context["novelty_score"],
            "cta_score": creative_context["cta_score"],
            "best_platform": creative_context["best_platform"],
            "primary_angle": creative_context["primary_angle"],
            "timeline_insights": creative_context["timeline_insights"][:4],
        },
        "personas": compact_personas,
    }


def infer_reason_code(
    persona: dict[str, Any],
    creative_context: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> tuple[str, float]:
    """Infer a reason code and rough drop-off anchor from creative and transcript signals."""
    archetype = str(persona.get("archetype", ""))
    first_speech = float(transcript_signals.get("first_speech_time", 0) or 0)
    hook_moment = pick_primary_moment(transcript_signals, "hook_moments")
    benefit_moment = pick_primary_moment(transcript_signals, "benefit_moments")
    proof_moment = pick_primary_moment(transcript_signals, "proof_moments")
    cta_moment = pick_primary_moment(transcript_signals, "cta_moments")
    overload_moment = pick_primary_moment(transcript_signals, "overload_moments")
    hook_anchor = float(hook_moment["start"]) if hook_moment else 1.4
    benefit_anchor = float(benefit_moment["start"]) if benefit_moment else duration_seconds * 0.3
    proof_anchor = float(proof_moment["start"]) if proof_moment else duration_seconds * 0.42
    cta_anchor = float(cta_moment["start"]) if cta_moment else duration_seconds * 0.82
    overload_anchor = float(overload_moment["start"]) if overload_moment else duration_seconds * 0.58

    if first_speech > 0.5:
        return "silent_intro", min(first_speech + 0.4, duration_seconds)

    if archetype == "Scroller veloz":
        if creative_context["hook_score"] < 66 or hook_anchor > 1.5:
            return "intro_too_slow", min(hook_anchor + 0.4, duration_seconds)
        if creative_context["novelty_score"] < 68:
            return "low_novelty", min(hook_anchor + 0.7, duration_seconds)
    if archetype == "Cazador de tendencias":
        if creative_context["novelty_score"] < 70:
            return "low_novelty", min(hook_anchor + 0.7, duration_seconds)
        if creative_context["hook_score"] < 64:
            return "weak_visual_hook", min(hook_anchor + 0.5, duration_seconds)
    if archetype == "Entretenido casual":
        if creative_context["hook_score"] < 63:
            return "intro_too_slow", min(hook_anchor + 0.6, duration_seconds)
        if creative_context["pacing_score"] < 65:
            return "low_energy", min(duration_seconds * 0.34, duration_seconds)
    if archetype == "Comprador esceptico":
        if not proof_moment or creative_context["clarity_score"] < 72:
            return "claim_lacks_proof", min(proof_anchor + 0.6, duration_seconds)
        if cta_moment and cta_anchor > duration_seconds * 0.7:
            return "cta_too_late", min(cta_anchor + 0.2, duration_seconds)
    if archetype == "Comprador problema-solucion":
        if not benefit_moment or creative_context["clarity_score"] < 70:
            return "unclear_value", min(benefit_anchor + 0.7, duration_seconds)
        if not proof_moment:
            return "claim_lacks_proof", min(proof_anchor + 0.5, duration_seconds)
    if archetype == "Buscador de valor":
        if overload_moment and creative_context["audio_score"] < 67:
            return "cognitive_overload", min(overload_anchor + 0.4, duration_seconds)
        if not benefit_moment or creative_context["clarity_score"] < 70:
            return "unclear_value", min(benefit_anchor + 0.5, duration_seconds)
    if archetype == "Creador o marketer":
        if creative_context["visual_score"] < 70:
            return "weak_visual_hook", min(hook_anchor + 0.5, duration_seconds)
        if overload_moment:
            return "cognitive_overload", min(overload_anchor + 0.4, duration_seconds)
    if archetype == "Comprador impulsivo":
        if cta_moment and cta_anchor > duration_seconds * 0.68:
            return "cta_too_late", min(cta_anchor + 0.2, duration_seconds)
        if creative_context["hook_score"] < 64:
            return "intro_too_slow", min(hook_anchor + 0.5, duration_seconds)
    if archetype == "Viewer guiado por historia":
        if creative_context["pacing_score"] < 68:
            return "weak_story_payoff", min(duration_seconds * 0.7, duration_seconds)
        if creative_context["pacing_score"] < 64:
            return "low_energy", min(duration_seconds * 0.45, duration_seconds)
    if archetype == "Entusiasta de nicho":
        if not benefit_moment:
            return "irrelevant_for_audience", min(duration_seconds * 0.42, duration_seconds)
        if creative_context["clarity_score"] < 66:
            return "unclear_value", min(benefit_anchor + 0.8, duration_seconds)

    if creative_context["hook_score"] < 60 or hook_anchor > 1.9:
        return "intro_too_slow", min(hook_anchor + 0.5, duration_seconds)
    if archetype in {"Cazador de tendencias", "Entretenido casual"} and creative_context["novelty_score"] < 64:
        return "low_novelty", min(benefit_anchor + 0.6, duration_seconds)
    if archetype in {"Comprador esceptico", "Comprador problema-solucion"} and (
        not proof_moment or creative_context["clarity_score"] < 70
    ):
        return "claim_lacks_proof", min(proof_anchor + 0.8, duration_seconds)
    if archetype in {"Buscador de valor", "Comprador problema-solucion"} and (
        not benefit_moment or creative_context["clarity_score"] < 68
    ):
        return "unclear_value", min(benefit_anchor + 0.7, duration_seconds)
    if archetype == "Creador o marketer" and creative_context["visual_score"] < 68:
        return "weak_visual_hook", min(hook_anchor + 0.8, duration_seconds)
    if archetype == "Comprador impulsivo" and cta_moment and cta_anchor > duration_seconds * 0.72:
        return "cta_too_late", min(cta_anchor + 0.2, duration_seconds)
    if archetype == "Entusiasta de nicho":
        return "irrelevant_for_audience", min(duration_seconds * 0.42, duration_seconds)
    if archetype == "Viewer guiado por historia" and creative_context["pacing_score"] < 66:
        return "weak_story_payoff", min(duration_seconds * 0.74, duration_seconds)
    if overload_moment and creative_context["audio_score"] < 64:
        return "too_much_talking", min(overload_anchor + 0.6, duration_seconds)
    if overload_moment and archetype in {"Buscador de valor", "Creador o marketer", "Comprador esceptico"}:
        return "cognitive_overload", min(overload_anchor + 0.5, duration_seconds)
    if creative_context["pacing_score"] < 63:
        return "low_energy", min(duration_seconds * 0.46, duration_seconds)
    return "unclear_value", min(duration_seconds * 0.38, duration_seconds)


def build_persona_evidence(
    persona: dict[str, Any],
    reason_code: str,
    anchor_second: float,
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    """Build evidence-backed explanation fields for a persona."""
    tag_map = {
        "silent_intro": "hook",
        "intro_too_slow": "hook",
        "unclear_value": "benefit",
        "claim_lacks_proof": "proof",
        "weak_visual_hook": "hook",
        "low_energy": None,
        "too_much_talking": "overload",
        "cognitive_overload": "overload",
        "low_novelty": "hook",
        "irrelevant_for_audience": "benefit",
        "cta_too_late": "cta",
        "weak_story_payoff": None,
    }
    segments = transcript_signals.get("segments", [])
    preferred_tag = tag_map.get(reason_code)
    preferred_candidates = [
        segment for segment in segments if not preferred_tag or preferred_tag in segment.get("tags", [])
    ]
    disliked_segment = pick_segment_for_persona(preferred_candidates or segments, persona, anchor_second)
    liked_candidates = (
        transcript_signals.get("benefit_moments", [])
        or transcript_signals.get("proof_moments", [])
        or transcript_signals.get("hook_moments", [])
        or segments
    )
    liked_segment = pick_segment_for_persona(liked_candidates, persona, max(anchor_second * 0.6, 0.3))
    evidence_segment = disliked_segment or liked_segment
    evidence_start = round_value(float(evidence_segment["start"]), 1) if evidence_segment else round_value(anchor_second, 1)
    evidence_end = round_value(float(evidence_segment["end"]), 1) if evidence_segment else round_value(min(duration_seconds, anchor_second + 0.8), 1)
    evidence_excerpt = str(evidence_segment.get("excerpt", "")) if evidence_segment else ""
    decision_stage = str(evidence_segment.get("stage")) if evidence_segment else stage_from_second(anchor_second, duration_seconds)

    liked_text = (
        f"Se queda atento cuando aparece el tramo \"{liked_segment.get('excerpt', '')}\""
        if liked_segment and liked_segment.get("excerpt")
        else "Se queda atento cuando el video finalmente aterriza una idea concreta."
    )
    disliked_text = (
        f"Empieza a perder interes cuando el video entra en \"{evidence_excerpt}\""
        if evidence_excerpt
        else "Empieza a perder interes cuando el video deja de avanzar con claridad."
    )
    return {
        "liked_moment": liked_text,
        "disliked_moment": disliked_text,
        "evidence_start_second": evidence_start,
        "evidence_end_second": max(evidence_end, evidence_start),
        "evidence_excerpt": evidence_excerpt or "No hay evidencia verbal suficientemente clara en ese tramo.",
        "decision_stage": decision_stage,
    }


def default_persona_reason(
    persona: dict[str, Any],
    creative_context: dict[str, Any],
    transcript: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    """Generate evidence-backed fallback for a persona."""
    rng = random.Random(
        f"{persona['persona_id']}::{creative_context['overall_score']}::{creative_context['hook_score']}::{duration_seconds}"
    )
    reason_code, anchor = infer_reason_code(persona, creative_context, transcript_signals, duration_seconds)
    proof_moment = pick_primary_moment(transcript_signals, "proof_moments")
    cta_moment = pick_primary_moment(transcript_signals, "cta_moments")
    overload_moment = pick_primary_moment(transcript_signals, "overload_moments")
    if persona.get("age_range") == "18-24" and reason_code == "unclear_value":
        reason_code = "low_novelty"
    if persona.get("social_status") == "Dueno de negocio" and reason_code in {"unclear_value", "low_novelty"} and cta_moment:
        reason_code = "cta_too_late"
        anchor = float(cta_moment["start"])
    if persona.get("social_status") == "Profesional consolidado" and overload_moment and reason_code == "unclear_value":
        reason_code = "cognitive_overload"
        anchor = float(overload_moment["start"])
    if persona.get("country") in {"Alemania", "Francia"} and proof_moment and reason_code == "unclear_value":
        reason_code = "claim_lacks_proof"
        anchor = float(proof_moment["start"])
    archetype_bias = {
        "Scroller veloz": -1.1,
        "Cazador de tendencias": -0.7,
        "Buscador de valor": 0.4,
        "Comprador esceptico": 0.7,
        "Entusiasta de nicho": 0.5,
        "Entretenido casual": -0.4,
        "Comprador problema-solucion": 0.9,
        "Creador o marketer": 0.3,
        "Comprador impulsivo": -0.2,
        "Viewer guiado por historia": 1.1,
    }
    base = anchor + archetype_bias.get(str(persona.get("archetype", "")), 0) + rng.uniform(-0.6, 0.7)
    if persona.get("age_range") == "18-24":
        base -= 0.3
    if persona.get("social_status") == "Dueno de negocio":
        base += 0.4

    dropoff_second = round_value(clamp(base, 0.8, duration_seconds), 1)
    retention_percent = int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100))
    reason_label = LEAVE_REASON_LABELS.get(reason_code, "Motivo no clasificado")
    evidence = build_persona_evidence(persona, reason_code, dropoff_second, transcript_signals, duration_seconds)
    why_they_left = (
        f"{persona['name']} abandona por {reason_label.lower()} cerca de {dropoff_second}s. "
        f"El quiebre aparece cuando evalúa \"{evidence['evidence_excerpt']}\" y siente que el video no termina "
        f"de resolver lo que esperaba ver."
    )
    summary_of_interacion = (
        f"{persona['name']} primero conecta con el tramo que le resulta más prometedor, pero termina saliendo en la fase "
        f"{evidence['decision_stage']} por {reason_label.lower()} al no encontrar suficiente avance."
    )
    return {
        "dropoff_second": dropoff_second,
        "retention_percent": retention_percent,
        "reason_code": reason_code,
        "reason_label": reason_label,
        "why_they_left": why_they_left,
        "summary_of_interacion": summary_of_interacion,
        **evidence,
    }


def normalize_persona_result(
    persona: dict[str, Any],
    result: dict[str, Any],
    base: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    dropoff_second = round_value(clamp(float(result.get("dropoff_second", base["dropoff_second"])), 0.8, duration_seconds), 1)
    reason_code = str(result.get("reason_code", base["reason_code"])).strip()
    if reason_code not in LEAVE_REASON_LABELS:
        reason_code = base["reason_code"]
    evidence_start = round_value(clamp(float(result.get("evidence_start_second", base["evidence_start_second"])), 0, duration_seconds), 1)
    evidence_end = round_value(clamp(float(result.get("evidence_end_second", base["evidence_end_second"])), evidence_start, duration_seconds), 1)
    evidence_excerpt = str(result.get("evidence_excerpt", base["evidence_excerpt"])).strip() or base["evidence_excerpt"]
    decision_stage = str(result.get("decision_stage", base["decision_stage"])).strip().lower()
    if decision_stage not in {"hook", "desarrollo", "prueba", "cta", "cierre"}:
        decision_stage = stage_from_second(evidence_start or dropoff_second, duration_seconds)

    if len(evidence_excerpt.split()) < 3:
        evidence_fallback = build_persona_evidence(persona, reason_code, dropoff_second, transcript_signals, duration_seconds)
        evidence_start = evidence_fallback["evidence_start_second"]
        evidence_end = evidence_fallback["evidence_end_second"]
        evidence_excerpt = evidence_fallback["evidence_excerpt"]
        decision_stage = evidence_fallback["decision_stage"]

    return {
        **persona,
        "dropoff_second": dropoff_second,
        "retention_percent": int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100)),
        "reason_code": reason_code,
        "reason_label": LEAVE_REASON_LABELS.get(reason_code, base["reason_label"]),
        "why_they_left": str(result.get("why_they_left", base["why_they_left"])).strip() or base["why_they_left"],
        "summary_of_interacion": str(result.get("summary_of_interacion", base["summary_of_interacion"])).strip() or base["summary_of_interacion"],
        "liked_moment": str(result.get("liked_moment", base["liked_moment"])).strip() or base["liked_moment"],
        "disliked_moment": str(result.get("disliked_moment", base["disliked_moment"])).strip() or base["disliked_moment"],
        "evidence_start_second": evidence_start,
        "evidence_end_second": evidence_end,
        "evidence_excerpt": evidence_excerpt,
        "decision_stage": decision_stage,
    }


def batch_needs_retry(personas: list[dict[str, Any]]) -> bool:
    if not personas:
        return False
    reason_counts = Counter(item.get("reason_code", "unclear_value") for item in personas)
    evidence_counts = Counter(str(item.get("evidence_excerpt", "")).strip().lower() for item in personas if item.get("evidence_excerpt"))
    dominant_reason_count = reason_counts.most_common(1)[0][1]
    dominant_evidence_count = evidence_counts.most_common(1)[0][1] if evidence_counts else 0
    distinct_reasons = len(reason_counts)
    distinct_dropoffs = len({round(float(item.get("dropoff_second", 0)), 1) for item in personas})
    evidence_ok = sum(1 for item in personas if len(str(item.get("evidence_excerpt", "")).split()) >= 3)
    dropoff_std = pstdev([float(item.get("dropoff_second", 0)) for item in personas]) if len(personas) > 1 else 0.0
    return (
        dominant_reason_count >= max(12, int(len(personas) * 0.55))
        or dominant_evidence_count >= max(10, int(len(personas) * 0.5))
        or distinct_reasons < 5
        or distinct_dropoffs < 8
        or evidence_ok < max(16, int(len(personas) * 0.8))
        or dropoff_std < 1.4
    )


async def request_persona_batch_from_model(
    *,
    batch: list[dict[str, Any]],
    creative_context: dict[str, Any],
    transcript: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
    retry_note: str | None = None,
) -> dict[str, Any] | None:
    spec = build_persona_batch_spec(LEAVE_REASON_LABELS.keys())
    user_payload = {
        **build_compact_persona_prompt_payload(
            batch=batch,
            creative_context=creative_context,
            transcript=transcript,
            transcript_signals=transcript_signals,
            duration_seconds=duration_seconds,
        ),
        "quality_requirements": [
            "Usa evidence_excerpt y timestamps reales.",
            "No concentres casi todas las personas en el mismo reason_code si el transcript no lo justifica.",
            "Haz que why_they_left y summary_of_interacion se sientan especificos del video y de la persona.",
            "Distribuye la atencion entre distintos momentos del video cuando el material tenga mas de un beat relevante.",
            "No repitas el mismo evidence_excerpt para la mayoria del batch.",
            "Si necesitas ahorrar tokens, prioriza persona_id, dropoff_second, reason_code y evidence_excerpt; el backend completara el resto.",
        ],
    }
    if retry_note:
        user_payload["retry_note"] = retry_note

    return await call_groq_chat_json(
        messages=[
            {"role": "system", "content": spec.system_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        schema_name=spec.schema_name,
        schema=persona_batch_compact_schema(),
        model=resolve_prompt_model(spec.default_model, spec.model_env_var),
        strict=True,
        temperature=spec.temperature,
        timeout_seconds=spec.timeout_seconds,
    )


async def analyze_persona_batch(
    batch: list[dict[str, Any]],
    creative_context: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> list[dict[str, Any]]:
    """Analyze a batch of personas using Groq LLM with evidence validation."""
    transcript_signals = derive_transcript_signals(transcript, duration_seconds)
    fallback_results = [
        {**persona, **default_persona_reason(persona, creative_context, transcript, transcript_signals, duration_seconds)}
        for persona in batch
    ]
    try:
        normalized: list[dict[str, Any]] | None = None
        retry_note: str | None = None
        for attempt in range(2):
            response = await request_persona_batch_from_model(
                batch=batch,
                creative_context=creative_context,
                transcript=transcript,
                transcript_signals=transcript_signals,
                duration_seconds=duration_seconds,
                retry_note=retry_note,
            )
            if not response or "personas" not in response:
                continue
            mapped = {
                item.get("persona_id"): item
                for item in response.get("personas", [])
                if isinstance(item, dict) and item.get("persona_id")
            }
            normalized = []
            for persona in batch:
                base = default_persona_reason(persona, creative_context, transcript, transcript_signals, duration_seconds)
                result = mapped.get(persona["persona_id"], {})
                normalized.append(
                    normalize_persona_result(
                        persona,
                        result,
                        base,
                        transcript_signals,
                        duration_seconds,
                    )
                )
            if not batch_needs_retry(normalized):
                return normalized
            retry_note = (
                "La salida anterior colapso demasiado: diversifica reason_code, distribuye mejor dropoff_second y usa evidencia mas especifica "
                "del transcript para cada persona."
            )
            if attempt == 1:
                return fallback_results if batch_needs_retry(normalized) and not batch_needs_retry(fallback_results) else normalized
        return normalized or fallback_results
    except Exception as exc:
        print(f"Persona batch analysis failed: {exc}")
        return fallback_results
