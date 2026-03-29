from __future__ import annotations

import hashlib
import json
import random
from collections import Counter
from statistics import pstdev
from typing import Any

from config import resolve_prompt_model
from constants import (
    LEAVE_REASON_LABELS,
    PERSONA_AUDIENCE_CONTEXTS,
    PERSONA_COLOR_PALETTE,
    PERSONA_FRUSTRATIONS,
    PERSONA_HOBBIES,
    PERSONA_INTEREST_PROFILES,
    PERSONA_INTERESTS,
    PERSONA_LAST_NAME_SEEDS,
    PERSONA_MOTIVATIONS,
    PERSONA_NAME_SEEDS,
    PERSONA_NATIVE_LANGUAGES,
)
from schemas import persona_batch_compact_schema
from services.groq_client import call_groq_chat_json
from services.transcript_signals import derive_transcript_signals, pick_primary_moment, stage_from_second
from system_prompts import build_persona_batch_spec
from utils import clamp, round_value


def normalize_seed_text(text: str) -> str:
    return " ".join(text.lower().split()).strip()


def canonical_language(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    aliases = {
        "spanish": "es",
        "espanol": "es",
        "español": "es",
        "english": "en",
        "ingles": "en",
        "inglés": "en",
        "portuguese": "pt",
        "portugues": "pt",
        "português": "pt",
        "french": "fr",
        "frances": "fr",
        "francés": "fr",
        "german": "de",
        "aleman": "de",
        "alemán": "de",
    }
    return aliases.get(normalized, normalized[:2] if normalized else "")


def language_family(language_code: str) -> str:
    families = {
        "es": "romance",
        "pt": "romance",
        "fr": "romance",
        "it": "romance",
        "en": "germanic",
        "de": "germanic",
        "nl": "germanic",
    }
    return families.get(language_code, language_code)


def build_platform_habits(age_range: str, country: str) -> str:
    if age_range in {"<18", "18-24"}:
        return f"Consume TikTok e Instagram varias veces al dia y decide en segundos si el video vale seguir viendolo desde {country}."
    if age_range in {"55-64", "65+"}:
        return f"Combina Facebook, YouTube Shorts e Instagram, y necesita claridad rapida para seguir mirando desde {country}."
    return f"Alterna Reels, TikTok y Shorts durante el dia y decide rapido si el contenido justifica su atencion desde {country}."


def build_audience_context_label(persona: dict[str, Any]) -> str:
    return f"{persona['gender']} · {persona['age_range']} · {persona['country']}"


def build_video_seed(video_id: str, transcript_text: str, duration_seconds: int) -> int:
    """Build a deterministic seed for persona identities from video content."""
    normalized_transcript = normalize_seed_text(transcript_text)
    seed_basis = normalized_transcript
    if len(seed_basis) < 32:
        # If the transcript is too short, add the video id only as fallback entropy.
        seed_basis = f"{seed_basis}::{video_id}".strip(":")
    digest = hashlib.sha256(f"{seed_basis}::{int(round(duration_seconds))}".encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def max_surname_streak(names: list[str]) -> int:
    longest = 0
    current = 0
    previous_surname = ""
    for name in names:
        surname = name.rsplit(" ", 1)[-1]
        if surname == previous_surname:
            current += 1
        else:
            current = 1
            previous_surname = surname
        longest = max(longest, current)
    return longest


def build_seeded_full_names(count: int, seed: int) -> list[str]:
    """Build a deterministic but video-specific pool of unique full names."""
    candidate_pairs = [
        (first_name, last_name)
        for first_name in PERSONA_NAME_SEEDS
        for last_name in PERSONA_LAST_NAME_SEEDS
    ]
    if count > len(candidate_pairs):
        raise ValueError("Not enough unique full names configured for persona generation.")

    for offset in range(6):
        rng = random.Random(seed + (offset * 7919))
        pool = candidate_pairs[:]
        rng.shuffle(pool)
        selected: list[tuple[str, str]] = []
        used_full_names: set[str] = set()
        recent_first_names: list[str] = []
        recent_last_names: list[str] = []

        while len(selected) < count and pool:
            chosen_index = None
            fallback_index = None
            for index, (first_name, last_name) in enumerate(pool):
                full_name = f"{first_name} {last_name}"
                if full_name in used_full_names:
                    continue
                first_name_recent = first_name in recent_first_names[-4:]
                last_name_recent = last_name in recent_last_names[-2:]
                if not first_name_recent and not last_name_recent:
                    chosen_index = index
                    break
                if fallback_index is None and not last_name_recent:
                    fallback_index = index
            if chosen_index is None:
                chosen_index = fallback_index if fallback_index is not None else 0
            first_name, last_name = pool.pop(chosen_index)
            full_name = f"{first_name} {last_name}"
            selected.append((first_name, last_name))
            used_full_names.add(full_name)
            recent_first_names.append(first_name)
            recent_last_names.append(last_name)

        names = [f"{first_name} {last_name}" for first_name, last_name in selected]
        if len(names) == count and len(set(names)) == count and max_surname_streak(names) <= 2:
            return names

    raise RuntimeError("Could not build a valid seeded persona name set without visible clustering.")


def build_persona_library_for_video(
    *,
    video_id: str,
    transcript_text: str,
    duration_seconds: int,
) -> list[dict[str, Any]]:
    """Build the canonical 100 synthetic personas for one video deterministically."""
    personas: list[dict[str, Any]] = []
    video_seed = build_video_seed(video_id, transcript_text, duration_seconds)
    total_count = len(PERSONA_AUDIENCE_CONTEXTS) * len(PERSONA_INTEREST_PROFILES)
    seeded_names = build_seeded_full_names(total_count, video_seed)
    for context_index, context in enumerate(PERSONA_AUDIENCE_CONTEXTS):
        for interest_index, interest_profile in enumerate(PERSONA_INTEREST_PROFILES):
            index = context_index * len(PERSONA_INTEREST_PROFILES) + interest_index
            persona = {
                "persona_id": f"persona-{context_index + 1:02d}-{interest_index + 1:02d}",
                "name": seeded_names[index],
                "gender": context["gender"],
                "age_range": context["age_range"],
                "country": context["country"],
                "native_language": context.get("native_language") or PERSONA_NATIVE_LANGUAGES.get(context["country"], "en"),
                "occupation": interest_profile["occupation"],
                "income_bracket": context["income_bracket"],
                "social_status": context["social_status"],
                "interests": interest_profile.get("interests") or PERSONA_INTERESTS[index % len(PERSONA_INTERESTS)],
                "hobbies": interest_profile.get("hobbies") or PERSONA_HOBBIES[index % len(PERSONA_HOBBIES)],
                "niche_tags": interest_profile["niche_tags"],
                "life_story": (
                    f"Vive en {context['country']}, habla principalmente {context.get('native_language', 'en')} "
                    f"y consume contenido corto para decidir rapido si algo le sirve dentro de {interest_profile['niche_tags'][0]}."
                ),
                "platform_habits": build_platform_habits(context["age_range"], context["country"]),
                "motivations": interest_profile.get("motivations") or PERSONA_MOTIVATIONS[index % len(PERSONA_MOTIVATIONS)],
                "frustrations": interest_profile.get("frustrations") or PERSONA_FRUSTRATIONS[index % len(PERSONA_FRUSTRATIONS)],
                "demographic_profile_id": context["id"],
                "demographic_profile_label": f"{context['gender']} {context['age_range']} en {context['country']}",
                "audience_context_id": context["id"],
                "audience_context_label": "",
                "interest_profile_id": interest_profile["id"],
                "color": PERSONA_COLOR_PALETTE[interest_index % len(PERSONA_COLOR_PALETTE)],
            }
            persona["audience_context_label"] = build_audience_context_label(persona)
            persona["segment_label"] = persona["audience_context_label"]
            personas.append(persona)
    return personas


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
                "gender": persona["gender"],
                "age_range": persona["age_range"],
                "country": persona["country"],
                "native_language": persona["native_language"],
                "income_bracket": persona["income_bracket"],
                "social_status": persona["social_status"],
                "occupation": persona["occupation"],
                "interest": (persona.get("interests") or [""])[0],
                "hobby": (persona.get("hobbies") or [""])[0],
                "niche_tag": (persona.get("niche_tags") or [""])[0],
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
                "tags": segment.get("tags", [])[:4],
                "excerpt": str(segment.get("excerpt", "")),
                "visual_description": str(segment.get("visual_description", ""))[:180],
                "visual_excerpt": str(segment.get("visual_excerpt", ""))[:120],
                "on_screen_text": segment.get("on_screen_text", [])[:3],
                "retention_impact": segment.get("retention_impact", "neutral"),
            }
        )

    return {
        "duration_seconds": duration_seconds,
        "transcript_language": transcript.get("language"),
        "transcript_text": str(transcript.get("text", ""))[:900],
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
        "multimodal_analysis": {
            "summary": str(creative_context.get("video_summary", ""))[:420],
            "hook": str((creative_context.get("video_analysis") or {}).get("hook", ""))[:180],
            "visual_style": str((creative_context.get("video_analysis") or {}).get("visual_style", ""))[:220],
            "cta_notes": str((creative_context.get("video_analysis") or {}).get("cta_notes", ""))[:180],
        },
        "personas": compact_personas,
    }


def compute_language_affinity_multiplier(
    persona: dict[str, Any],
    transcript_language: str | None,
    creative_context: dict[str, Any],
) -> float:
    persona_language = canonical_language(persona.get("native_language"))
    video_language = canonical_language(transcript_language)
    if not persona_language or not video_language:
        return 0.92
    if persona_language == video_language:
        return 1.0

    multiplier = 0.72
    if language_family(persona_language) == language_family(video_language):
        multiplier += 0.08
    visual_score = float(creative_context.get("visual_score", 0))
    if visual_score >= 82:
        multiplier += 0.14
    elif visual_score >= 72:
        multiplier += 0.1
    elif visual_score >= 62:
        multiplier += 0.06
    if float(creative_context.get("clarity_score", 0)) >= 75:
        multiplier += 0.04
    return clamp(multiplier, 0.62, 0.96)


def infer_reason_code(
    persona: dict[str, Any],
    creative_context: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
    transcript_language: str | None,
) -> tuple[str, float]:
    """Infer a reason code and rough drop-off anchor from creative and transcript signals."""
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
    age_range = str(persona.get("age_range", ""))
    social_status = str(persona.get("social_status", ""))
    niche_tags = {str(tag).lower() for tag in persona.get("niche_tags", [])}
    language_multiplier = compute_language_affinity_multiplier(persona, transcript_language, creative_context)

    if first_speech > 0.5:
        return "silent_intro", min(first_speech + 0.4, duration_seconds)

    if language_multiplier <= 0.8 and creative_context["visual_score"] < 74:
        return "irrelevant_for_audience", min(benefit_anchor + 0.3, duration_seconds)
    if age_range in {"<18", "18-24"} and (creative_context["hook_score"] < 68 or hook_anchor > 1.4):
        return "intro_too_slow", min(hook_anchor + 0.4, duration_seconds)
    if age_range in {"<18", "18-24"} and creative_context["novelty_score"] < 68:
        return "low_novelty", min(hook_anchor + 0.7, duration_seconds)
    if niche_tags & {"growth marketing", "paid social", "analytics", "saas", "ai", "b2b", "ecommerce", "conversion"}:
        if not proof_moment or creative_context["clarity_score"] < 72:
            return "claim_lacks_proof", min(proof_anchor + 0.5, duration_seconds)
    if niche_tags & {"travel", "lifestyle", "social", "gaming", "creator economy"} and creative_context["visual_score"] < 68:
        return "weak_visual_hook", min(hook_anchor + 0.5, duration_seconds)
    if niche_tags & {"beauty", "conversion", "food", "hospitality", "consumer goods"} and cta_moment and cta_anchor > duration_seconds * 0.68:
        return "cta_too_late", min(cta_anchor + 0.2, duration_seconds)
    if social_status in {"Profesional consolidado", "Dueno de negocio", "Retirado activo"} and overload_moment:
        return "cognitive_overload", min(overload_anchor + 0.4, duration_seconds)
    if not benefit_moment or creative_context["clarity_score"] < 68:
        return "unclear_value", min(benefit_anchor + 0.6, duration_seconds)
    if creative_context["audio_score"] < 63 and overload_moment:
        return "too_much_talking", min(overload_anchor + 0.5, duration_seconds)
    if creative_context["pacing_score"] < 64:
        if age_range in {"55-64", "65+"}:
            return "weak_story_payoff", min(duration_seconds * 0.72, duration_seconds)
        return "low_energy", min(duration_seconds * 0.46, duration_seconds)
    if creative_context["visual_score"] < 66:
        return "weak_visual_hook", min(hook_anchor + 0.6, duration_seconds)
    return "unclear_value", min(duration_seconds * 0.38, duration_seconds)


def compose_segment_evidence(segment: dict[str, Any] | None) -> str:
    if not segment:
        return ""
    parts: list[str] = []
    excerpt = str(segment.get("excerpt", "")).strip()
    visual_excerpt = str(segment.get("visual_excerpt", "")).strip()
    on_screen_text = ", ".join(str(item).strip() for item in segment.get("on_screen_text", [])[:2] if str(item).strip())
    if excerpt:
        parts.append(f"voz: {excerpt}")
    if visual_excerpt:
        parts.append(f"visual: {visual_excerpt}")
    if on_screen_text:
        parts.append(f"texto en pantalla: {on_screen_text}")
    return " | ".join(parts)


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
    evidence_excerpt = compose_segment_evidence(evidence_segment)
    decision_stage = str(evidence_segment.get("stage")) if evidence_segment else stage_from_second(anchor_second, duration_seconds)

    if liked_segment:
        liked_evidence = compose_segment_evidence(liked_segment)
        liked_text = (
            f"Le engancha cuando aparece este tramo: {liked_evidence}"
            if liked_evidence
            else "Se queda atento cuando el video finalmente aterriza una idea concreta."
        )
    else:
        liked_text = "Se queda atento cuando el video finalmente aterriza una idea concreta."

    disliked_text = (
        f"Empieza a perder interes cuando entra este tramo: {evidence_excerpt}"
        if evidence_excerpt
        else "Empieza a perder interes cuando el video deja de avanzar con claridad."
    )
    return {
        "liked_moment": liked_text,
        "disliked_moment": disliked_text,
        "evidence_start_second": evidence_start,
        "evidence_end_second": max(evidence_end, evidence_start),
        "evidence_excerpt": evidence_excerpt or "No hay una evidencia multimodal suficientemente clara en ese tramo.",
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
    reason_code, anchor = infer_reason_code(
        persona,
        creative_context,
        transcript_signals,
        duration_seconds,
        transcript.get("language"),
    )
    language_multiplier = compute_language_affinity_multiplier(persona, transcript.get("language"), creative_context)
    social_status = str(persona.get("social_status", ""))
    age_range = str(persona.get("age_range", ""))
    niche_tags = {str(tag).lower() for tag in persona.get("niche_tags", [])}

    base = anchor + rng.uniform(-0.6, 0.7)
    if age_range in {"<18", "18-24"}:
        base -= 0.4
    if social_status == "Dueno de negocio":
        base += 0.4
    if social_status == "Retirado activo":
        base += 0.3
    if niche_tags & {"growth marketing", "paid social", "analytics", "saas", "ai"}:
        base += 0.35
    if niche_tags & {"travel", "lifestyle", "social"} and creative_context["visual_score"] >= 72:
        base += 0.3
    base -= (1 - language_multiplier) * max(duration_seconds * 0.35, 2.2)
    dropoff_second = round_value(clamp(base, 0.8, duration_seconds), 1)
    retention_percent = int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100))
    weighted_retention_score = round_value(retention_percent * language_multiplier, 1)
    reason_label = LEAVE_REASON_LABELS.get(reason_code, "Motivo no clasificado")
    evidence = build_persona_evidence(persona, reason_code, dropoff_second, transcript_signals, duration_seconds)
    why_they_left = (
        f"{persona['name']} abandona por {reason_label.lower()} cerca de {dropoff_second}s. "
        f"El quiebre aparece cuando evalua {evidence['evidence_excerpt']} y siente que el video no termina "
        f"de resolver lo que esperaba ver para alguien de {persona['country']} que habla {persona['native_language']}."
    )
    summary_of_interacion = (
        f"{persona['name']} primero conecta con el tramo que le resulta mas prometedor, pero termina saliendo en la fase "
        f"{evidence['decision_stage']} por {reason_label.lower()} al no encontrar suficiente relevancia, claridad o prueba."
    )
    return {
        "dropoff_second": dropoff_second,
        "retention_percent": retention_percent,
        "language_affinity_multiplier": language_multiplier,
        "weighted_retention_score": weighted_retention_score,
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
    transcript_language: str | None,
    creative_context: dict[str, Any],
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

    if len(evidence_excerpt.split()) < 4:
        evidence_fallback = build_persona_evidence(persona, reason_code, dropoff_second, transcript_signals, duration_seconds)
        evidence_start = evidence_fallback["evidence_start_second"]
        evidence_end = evidence_fallback["evidence_end_second"]
        evidence_excerpt = evidence_fallback["evidence_excerpt"]
        decision_stage = evidence_fallback["decision_stage"]

    language_multiplier = compute_language_affinity_multiplier(persona, transcript_language, creative_context)
    retention_percent = int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100))
    return {
        **persona,
        "dropoff_second": dropoff_second,
        "retention_percent": retention_percent,
        "language_affinity_multiplier": language_multiplier,
        "weighted_retention_score": round_value(retention_percent * language_multiplier, 1),
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


def order_personas_for_display(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return personas in a video-specific presentation order driven by retention and diversity."""
    if not personas:
        return []

    remaining = [dict(persona) for persona in personas]
    ordered: list[dict[str, Any]] = []
    used_reasons: set[str] = set()
    used_genders: set[str] = set()
    used_countries: set[str] = set()
    used_ages: set[str] = set()
    used_niches: set[str] = set()

    while remaining:
        best_index = 0
        best_score = float("-inf")
        for index, persona in enumerate(remaining):
            primary_niche = str((persona.get("niche_tags") or [""])[0])
            score = float(persona.get("weighted_retention_score", persona.get("retention_percent", 0))) * 3.2
            score += float(persona.get("dropoff_second", 0)) * 0.45
            if str(persona.get("reason_code", "")) not in used_reasons:
                score += 16
            if str(persona.get("gender", "")) not in used_genders:
                score += 8
            if str(persona.get("country", "")) not in used_countries:
                score += 8
            if str(persona.get("age_range", "")) not in used_ages:
                score += 8
            if primary_niche and primary_niche not in used_niches:
                score += 10
            if ordered:
                previous = ordered[-1]
                if str(previous.get("reason_code", "")) == str(persona.get("reason_code", "")):
                    score -= 7
                if str(previous.get("country", "")) == str(persona.get("country", "")):
                    score -= 4
                if str(previous.get("age_range", "")) == str(persona.get("age_range", "")):
                    score -= 4
                previous_surname = str(previous.get("name", "")).rsplit(" ", 1)[-1]
                current_surname = str(persona.get("name", "")).rsplit(" ", 1)[-1]
                if previous_surname == current_surname:
                    score -= 8
            if score > best_score:
                best_score = score
                best_index = index

        selected = remaining.pop(best_index)
        ordered.append(selected)
        used_reasons.add(str(selected.get("reason_code", "")))
        used_genders.add(str(selected.get("gender", "")))
        used_countries.add(str(selected.get("country", "")))
        used_ages.add(str(selected.get("age_range", "")))
        primary_niche = str((selected.get("niche_tags") or [""])[0])
        if primary_niche:
            used_niches.add(primary_niche)

    return [{**persona, "presentation_order": index} for index, persona in enumerate(ordered)]


def batch_needs_retry(personas: list[dict[str, Any]]) -> bool:
    if not personas:
        return False
    reason_counts = Counter(item.get("reason_code", "unclear_value") for item in personas)
    evidence_counts = Counter(
        str(item.get("evidence_excerpt", "")).strip().lower()
        for item in personas
        if item.get("evidence_excerpt")
    )
    dominant_reason_count = reason_counts.most_common(1)[0][1]
    dominant_evidence_count = evidence_counts.most_common(1)[0][1] if evidence_counts else 0
    distinct_reasons = len(reason_counts)
    distinct_dropoffs = len({round(float(item.get("dropoff_second", 0)), 1) for item in personas})
    evidence_ok = sum(1 for item in personas if len(str(item.get("evidence_excerpt", "")).split()) >= 4)
    dropoff_std = pstdev([float(item.get("dropoff_second", 0)) for item in personas]) if len(personas) > 1 else 0.0
    return (
        dominant_reason_count >= max(10, int(len(personas) * 0.5))
        or dominant_evidence_count >= max(8, int(len(personas) * 0.42))
        or distinct_reasons < 6
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
            "Toma en cuenta pais, idioma nativo y contexto cultural de cada persona.",
            "No concentres casi todas las personas en el mismo reason_code si el material no lo justifica.",
            "Haz que why_they_left y summary_of_interacion se sientan especificos del video y de la persona.",
            "Distribuye la atencion entre distintos momentos del video cuando el material tenga mas de un beat relevante.",
            "No repitas el mismo evidence_excerpt para la mayoria del batch.",
            "Si citas evidencia, combina si hace falta voz, visual y texto en pantalla.",
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
        {
            **persona,
            **default_persona_reason(persona, creative_context, transcript, transcript_signals, duration_seconds),
        }
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
                        transcript.get("language"),
                        creative_context,
                    )
                )
            if not batch_needs_retry(normalized):
                return normalized
            retry_note = (
                "La salida anterior colapso demasiado: diversifica reason_code, distribuye mejor dropoff_second y usa evidencia multimodal mas especifica para cada persona."
            )
            if attempt == 1:
                return fallback_results if batch_needs_retry(normalized) and not batch_needs_retry(fallback_results) else normalized
        return normalized or fallback_results
    except Exception as exc:
        print(f"Persona batch analysis failed: {exc}")
        return fallback_results
