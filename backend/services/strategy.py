from __future__ import annotations

import json
import re
from typing import Any

from config import GROQ_API_KEY, resolve_prompt_model
from schemas import final_copy_schema, strategic_outputs_schema
from services.groq_client import call_groq_chat_json, call_groq_text_completion
from services.retention import build_platform_fit_rows
from services.transcript_signals import derive_transcript_signals, pick_primary_moment
from system_prompts import FINAL_COPY_SPEC, get_strategic_outputs_spec, get_video_summary_spec
from utils import round_value, summary_has_placeholder_text


def _sanitize_summary_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text or "").strip()
    cleaned = re.sub(r"^el mensaje se desarrolla asi[:,]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^en este video de \d+s[:,]?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\"[^\"]{18,}\"", "", cleaned)
    cleaned = re.sub(r"'[^']{18,}'", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.;:")
    return cleaned
def compose_video_summary(summary_text: str) -> dict[str, str]:
    cleaned = re.sub(r"\s+", " ", summary_text or "").strip()
    cleaned = re.sub(r"\s*Fortalezas:\s*", " Fortalezas: ", cleaned, count=1, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*Debilidades:\s*", " Debilidades: ", cleaned, count=1, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    if cleaned and cleaned[-1] not in ".!?":
        cleaned = f"{cleaned}."

    narrative = re.split(r"\bFortalezas:\b", cleaned, maxsplit=1, flags=re.IGNORECASE)[0].strip()
    narrative = re.sub(r"\s+", " ", narrative).strip()
    return {
        "video_summary": cleaned,
        "summary_narrative": narrative or cleaned,
    }


def summary_is_actionable(summary: str) -> bool:
    normalized = re.sub(r"\s+", " ", summary or "").strip().lower()
    if summary_has_placeholder_text(summary):
        return False
    if "el mensaje se desarrolla asi" in normalized:
        return False
    if "hook, desarrollo y cierre" in normalized:
        return False
    if normalized.startswith("es un video corto de "):
        return False
    if "intenta instalar una promesa de valor" in normalized:
        return False
    if normalized.count('"') > 2 or normalized.count("'") > 2:
        return False
    if len(normalized.split()) < 40:
        return False
    return all(token in normalized for token in ["fortalezas:", "debilidades:"])


def describe_segment(segment: dict[str, Any] | None, *, fallback: str) -> str:
    if not segment:
        return fallback
    excerpt = _sanitize_summary_text(str(segment.get("excerpt", "")))
    text = str(segment.get("text", "")).strip()
    tags = set(segment.get("tags", []))
    lowered = text.lower()

    if "cta" in tags:
        return "cierra con una invitacion a actuar o seguir el siguiente paso"
    if "proof" in tags:
        return f"introduce una prueba o ejemplo concreto alrededor de \"{excerpt}\"" if excerpt else "introduce una prueba o ejemplo concreto"
    if "benefit" in tags:
        return f"empieza a aterrizar el beneficio cuando aparece \"{excerpt}\"" if excerpt else "empieza a aterrizar el beneficio"
    if text.count("!") >= 1 and len(lowered.split()) <= 6:
        return f"abre con una reaccion verbal breve de desconcierto alrededor de \"{excerpt}\"" if excerpt else "abre con una reaccion verbal breve de desconcierto"
    if text.count("!") >= 2 or any(token in lowered for token in ["holy", "waa", "wow", "what the"]):
        return "abre con una reaccion exaltada y algo caotica que prioriza sorpresa antes que claridad"
    if "?" in text:
        return f"lanza una pregunta o disparador alrededor de \"{excerpt}\"" if excerpt else "lanza una pregunta para captar atencion"
    if len(lowered.split()) <= 5:
        return f"abre con una frase muy breve alrededor de \"{excerpt}\"" if excerpt else "abre con una frase muy breve como disparador"
    return f"desarrolla la idea principal alrededor de \"{excerpt}\"" if excerpt else fallback


def build_compact_signal_beats(transcript_signals: dict[str, Any], limit: int = 6) -> list[dict[str, Any]]:
    beats: list[dict[str, Any]] = []
    for segment in transcript_signals.get("segments", [])[:limit]:
        beats.append(
            {
                "start": round_value(float(segment.get("start", 0)), 1),
                "end": round_value(float(segment.get("end", segment.get("start", 0))), 1),
                "stage": segment.get("stage"),
                "tags": segment.get("tags", [])[:3],
                "excerpt": _sanitize_summary_text(str(segment.get("excerpt", ""))),
            }
        )
    return beats


def build_compact_summary_payload(
    *,
    creative_context: dict[str, Any],
    target_audience: dict[str, Any] | None,
    transcript: dict[str, Any],
    transcript_signals: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    safe_target = target_audience or {}
    return {
        "duration_seconds": duration_seconds,
        "transcript_text": _sanitize_summary_text(str(transcript.get("text", "")))[:800],
        "beats": build_compact_signal_beats(transcript_signals, limit=6),
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
        "creative_context": {
            "overall_score": creative_context.get("overall_score"),
            "hook_score": creative_context.get("hook_score"),
            "clarity_score": creative_context.get("clarity_score"),
            "pacing_score": creative_context.get("pacing_score"),
            "cta_score": creative_context.get("cta_score"),
            "best_platform": creative_context.get("best_platform"),
            "primary_angle": creative_context.get("primary_angle"),
            "strongest_points": creative_context.get("strongest_points", [])[:2],
            "weaknesses": creative_context.get("weaknesses", [])[:2],
        },
        "target_audience": {
            "primaryAudience": safe_target.get("primaryAudience"),
            "secondaryAudience": safe_target.get("secondaryAudience"),
            "topCountries": safe_target.get("countries", [])[:2],
            "topAgeRanges": safe_target.get("ageRanges", [])[:2],
        },
    }


def build_transcript_grounded_summary(
    transcript: dict[str, Any],
    creative_context: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str]:
    """Build a grounded summary from transcript without reciting it."""
    transcript_signals = derive_transcript_signals(transcript, duration_seconds)
    segments = transcript_signals.get("segments", [])
    opening_segment = segments[0] if segments else None
    middle_segment = (
        pick_primary_moment(transcript_signals, "benefit_moments")
        or pick_primary_moment(transcript_signals, "proof_moments")
        or (segments[len(segments) // 2] if segments else None)
    )
    closing_segment = pick_primary_moment(transcript_signals, "cta_moments") or (segments[-1] if segments else None)
    benefit_moment = pick_primary_moment(transcript_signals, "benefit_moments")
    proof_moment = pick_primary_moment(transcript_signals, "proof_moments")
    cta_moment = pick_primary_moment(transcript_signals, "cta_moments")
    first_speech = float(transcript_signals.get("first_speech_time", 0) or 0)

    opening_line = describe_segment(
        opening_segment,
        fallback="abre sin dejar completamente claro el beneficio desde el primer segundo",
    )
    middle_line = describe_segment(
        middle_segment,
        fallback="en la parte media intenta desarrollar la promesa, pero sin volverla del todo concreta",
    )
    closing_line = describe_segment(
        closing_segment,
        fallback="hacia el cierre no termina de convertir la atencion en una accion clara",
    )

    promise_line = (
        f"La propuesta de valor se vuelve entendible cerca de {round_value(float(benefit_moment['start']), 1)}s."
        if benefit_moment
        else "La propuesta de valor nunca termina de aterrizarse con suficiente claridad."
    )
    proof_line = (
        f"La prueba aparece alrededor de {round_value(float(proof_moment['start']), 1)}s, pero llega despues de la primera decision fuerte de abandono."
        if proof_moment
        else "La pieza sugiere una promesa, pero no la demuestra con una prueba visible o verbal lo bastante contundente."
    )
    cta_line = (
        f"La llamada a la accion aparece cerca de {round_value(float(cta_moment['start']), 1)}s."
        if cta_moment
        else "La pieza no deja una llamada a la accion claramente marcada."
    )
    opening_timing = (
        f"Empieza a hablar cerca de {round_value(first_speech, 1)}s."
        if first_speech > 0.3
        else "Empieza a hablar de inmediato."
    )

    strengths = [
        str(point) for point in creative_context.get("strongest_points", [])[:3] if str(point).strip()
    ] or [
        "La pieza tiene suficiente energia para frenar el scroll al menos de forma inicial.",
        "Hay una promesa aprovechable si se vuelve mas concreta.",
    ]
    weaknesses = [
        str(point) for point in creative_context.get("weaknesses", [])[:3] if str(point).strip()
    ] or [
        "La apertura no deja claro el beneficio real con suficiente rapidez.",
        "La prueba llega tarde o se siente insuficiente para sostener la atencion.",
    ]

    summary_text = (
        f"El video {opening_line}. En la parte media {middle_line}. Hacia el cierre {closing_line}. "
        f"{opening_timing} {promise_line} {proof_line} {cta_line} "
        f"Fortalezas: {'; '.join(_sanitize_summary_text(item) for item in strengths[:3])}. "
        f"Debilidades: {'; '.join(_sanitize_summary_text(item) for item in weaknesses[:3])}."
    )
    return compose_video_summary(summary_text)
def default_media_targeting(
    target_audience: dict[str, Any],
    top_reasons: list[dict[str, Any]],
    best_platform: str,
) -> list[dict[str, Any]]:
    """Generate default media targeting recommendations."""
    reason_one = top_reasons[0]["reasonLabel"] if top_reasons else "intro demasiado lenta"
    reason_two = top_reasons[1]["reasonLabel"] if len(top_reasons) > 1 else "falta de prueba"
    reason_three = top_reasons[2]["reasonLabel"] if len(top_reasons) > 2 else "CTA tardío"
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    return [
        {
            "recommendation": "Prospecting frío",
            "implementation": f"Targetear {primary} con un corte hook-first en {best_platform} que ataque {reason_one.lower()} en el primer segundo.",
        },
        {
            "recommendation": "Retargeting mid-funnel",
            "implementation": f"Servir una versión proof-led a quienes vieron 50%+, corrigiendo {reason_two.lower()} con demo visible antes del segundo 4.",
        },
        {
            "recommendation": "Conversión high-intent",
            "implementation": f"Mostrar una versión más directa a {secondary}, adelantando CTA y resolviendo {reason_three.lower()} antes de la caída principal.",
        },
    ]


def default_version_strategies(
    target_audience: dict[str, Any],
    top_reasons: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Generate default version strategies (A/B/C variants)."""
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    return [
        {
            "id": "A",
            "name": "Variante A",
            "targetAudience": primary,
            "direction": "Hook rápido para capturar atención desde el primer frame.",
            "structuralChanges": ["Abrir con outcome inmediato", "Cortar setup inicial", "Agregar patrón visual fuerte en segundo 2-3"],
            "whyItShouldResonate": "Funciona mejor para segmentos que abandonan por intro lenta o falta de novedad.",
        },
        {
            "id": "B",
            "name": "Variante B",
            "targetAudience": secondary,
            "direction": "Edición centrada en prueba para compradores más escépticos.",
            "structuralChanges": ["Mostrar evidencia temprano", "Reducir claims abstractos", "Conectar CTA con la prueba principal"],
            "whyItShouldResonate": "Apunta a quienes necesitan validación concreta antes de seguir mirando.",
        },
        {
            "id": "C",
            "name": "Variante C",
            "targetAudience": "Audiencias orientadas a storytelling",
            "direction": "Narrativa más aspiracional y emocional, con payoff más claro al cierre.",
            "structuralChanges": ["Reordenar el arco del relato", "Mantener tensión en mitad del video", "Cerrar con resolución memorable"],
            "whyItShouldResonate": "Busca capturar a quienes valoran contexto, construcción y cierre emocional.",
        },
    ]


def default_final_copy(
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    """Generate default final copy."""
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    top_country = target_audience["countries"][0]["label"] if target_audience["countries"] else "Estados Unidos"
    best_platform = creative_context["best_platform"]
    return {
        "video_summary": (
            f"Este video de {duration_seconds}s presenta una propuesta creativa con el foco puesto en {creative_context['primary_angle'].lower()}. "
            f"La idea principal se entiende mejor cuando aparece la prueba o el beneficio concreto, y el público que más resuena hoy es {primary}. "
            f"El principal problema es que la apertura tarda demasiado en mostrar el payoff, lo que debilita la retención inicial. "
            f"Para marketing, la oportunidad es clara: hacer más fuerte los primeros segundos, conservar el momento de mayor prueba y usar {best_platform} como primer canal de distribución."
        ),
        "summary_narrative": f"La creatividad tiene una propuesta clara, pero los primeros segundos todavía retrasan el payoff. La mayor resonancia viene de {primary}, con un segundo grupo fuerte en {secondary}, y el mejor primer canal pago es {best_platform}.",
        "strengths": creative_context["strongest_points"],
        "weaknesses": creative_context["weaknesses"],
        "recommendations": [
            {"title": "Corregir la apertura", "issue": "El payoff llega despues de la primera ventana critica de swipe.", "action": "Abri con el resultado, no con la explicacion.", "example": "Arranca con el beneficio visual o hablado mas claro en el primer segundo."},
            {"title": "Ajustar la parte media", "issue": "El impulso cae cuando la edicion se vuelve demasiado descriptiva.", "action": "Suma un pattern interrupt o un beat de prueba donde la atencion cae por primera vez.", "example": "Recorta los primeros 1.5s e introduci un cambio visual cerca del segundo tres."},
            {"title": "Adelantar la llamada a la accion", "issue": "El pedido hoy aparece cuando la atencion ya se debilito.", "action": "Pega la llamada a la accion al momento de payoff mas fuerte.", "example": "Pedi el click o el guardado justo despues del frame de prueba mas claro."},
            {"title": "Construir iteraciones pagas alrededor del ganador", "issue": "El mejor fit de audiencia hoy esta concentrado en un grupo bastante puntual.", "action": "Lanza el primer test pago sobre la audiencia que mas resuena antes de abrir el targeting.", "example": f"Empeza con {primary} en {top_country}, y despues abri hacia {secondary}."},
        ],
        "ad_strategy": {
            "campaignGoal": "Ideal para testing creativo pago",
            "why": "El concepto es lo suficientemente fuerte como para testearlo en mercado, pero la edicion de apertura sigue concentrando la mayor oportunidad de mejora.",
            "focus": "Usa la inversion paga primero como bucle de aprendizaje y escala al ganador recien despues de que la retencion valide el nuevo hook.",
            "bestAudience": primary,
            "audienceWhy": "Este grupo sigue mirando mas tiempo porque el valor se vuelve practico lo suficientemente rapido como para sostener su atencion.",
            "messageAngle": creative_context["primary_angle"],
            "creativeVariants": ["Hook centrado en el resultado", "Hook centrado en el problema", "Version centrada en prueba con llamada a la accion mas temprana"],
            "audienceHypotheses": [f"Audiencia principal en {top_country}", secondary, "Pool de retargeting de personas que vieron al menos el 50%"],
            "testingApproach": "Lanza dos variantes de apertura con el mismo targeting, lee primero la retencion y recien despues amplia presupuesto sobre la curva mas plana.",
        },
        "cross_post_summary": f"El transcript encaja mejor en {best_platform}, pero tambien puede viajar a LinkedIn y Facebook con un encuadre mas orientado a negocio.",
        "platforms": build_platform_fit_rows(best_platform, creative_context),
    }


async def synthesize_video_summary(
    creative_context: dict[str, Any],
    target_audience: dict[str, Any] | None,
    transcript: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str] | None:
    """Synthesize video summary using Groq LLM."""
    if not GROQ_API_KEY:
        return None

    try:
        spec = get_video_summary_spec()
        transcript_signals = derive_transcript_signals(transcript, duration_seconds)
        prompt_payload = build_compact_summary_payload(
            creative_context=creative_context,
            target_audience=target_audience,
            transcript=transcript,
            transcript_signals=transcript_signals,
            duration_seconds=duration_seconds,
        )
        response = await call_groq_text_completion(
            messages=[
                {
                    "role": "system",
                    "content": spec.system_prompt,
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            **prompt_payload,
                            "instruction": (
                                "Resume que pasa realmente en el video como si se lo explicaras a un jurado. "
                                "No recites el transcript; sintetizalo. "
                                "Si el material es confuso, describi esa confusion y por que perjudica la retencion."
                            ),
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )
        if not response:
            return None
        summary_payload = compose_video_summary(response)
        if not summary_is_actionable(summary_payload["video_summary"]):
            return None
        return summary_payload
    except Exception as exc:
        print(f"Video summary synthesis failed: {exc}")
        return None


async def synthesize_final_copy(
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    personas: list[dict[str, Any]],
    transcript: dict[str, Any],
    duration_seconds: int,
    video_analysis: dict[str, Any] | None = None,
    precomputed_summary: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Synthesize final copy using Groq LLM."""
    spec = FINAL_COPY_SPEC
    fallback = default_final_copy(creative_context, target_audience, duration_seconds)
    grounded_summary = build_transcript_grounded_summary(transcript, creative_context, duration_seconds)
    fallback["video_summary"] = grounded_summary["video_summary"]
    fallback["summary_narrative"] = grounded_summary["summary_narrative"]
    summary_response = precomputed_summary or await synthesize_video_summary(
        creative_context,
        target_audience,
        transcript,
        duration_seconds,
    )
    if summary_response:
        if summary_response.get("video_summary"):
            fallback["video_summary"] = summary_response["video_summary"]
        if summary_response.get("summary_narrative"):
            fallback["summary_narrative"] = summary_response["summary_narrative"]
    try:
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
                            "creative_context": creative_context,
                            "video_analysis": video_analysis,
                            "target_audience": target_audience,
                            "persona_examples": personas[:10],
                            "transcript": transcript,
                            "duration_seconds": duration_seconds,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name=spec.schema_name,
            schema=final_copy_schema(),
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )
        if not response:
            return fallback
        merged = {**fallback, **response}
        merged["recommendations"] = response.get("recommendations") or fallback["recommendations"]
        merged["ad_strategy"] = response.get("ad_strategy") or fallback["ad_strategy"]
        merged["platforms"] = response.get("platforms") or fallback["platforms"]
        candidate_summary = compose_video_summary(str(response.get("video_summary", "")).strip())
        if summary_response and not summary_has_placeholder_text(summary_response.get("video_summary", "")):
            merged["video_summary"] = summary_response["video_summary"]
            merged["summary_narrative"] = summary_response["summary_narrative"]
        elif response.get("video_summary") and summary_is_actionable(candidate_summary["video_summary"]):
            merged["video_summary"] = candidate_summary["video_summary"]
            merged["summary_narrative"] = candidate_summary["summary_narrative"]
        elif summary_has_placeholder_text(str(merged.get("video_summary", ""))) or not summary_is_actionable(str(merged.get("video_summary", ""))):
            merged["video_summary"] = grounded_summary["video_summary"]
            merged["summary_narrative"] = grounded_summary["summary_narrative"]
        return merged
    except Exception as exc:
        print(f"Final copy synthesis failed: {exc}")
        return fallback


async def synthesize_strategic_outputs(
    *,
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    personas: list[dict[str, Any]],
    transcript: dict[str, Any],
    duration_seconds: int,
    average_line: list[dict[str, Any]],
    change_plan: dict[str, Any],
    segment_diagnoses: list[dict[str, Any]],
) -> dict[str, Any]:
    """Synthesize strategic outputs using Groq LLM."""
    spec = get_strategic_outputs_spec()
    fallback = {
        "change_plan": change_plan,
        "media_targeting": default_media_targeting(
            target_audience,
            change_plan.get("topLeaveReasons", []),
            creative_context["best_platform"],
        ),
        "version_strategies": default_version_strategies(
            target_audience,
            change_plan.get("topLeaveReasons", []),
        ),
    }

    try:
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
                            "creative_context": creative_context,
                            "target_audience": target_audience,
                            "segment_diagnoses": segment_diagnoses,
                            "change_plan_seed": change_plan,
                            "average_line": average_line,
                            "transcript": transcript,
                            "persona_examples": personas[:20],
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name=spec.schema_name,
            schema=strategic_outputs_schema(),
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )
        if not response:
            return fallback
        return {
            "change_plan": response.get("change_plan") or fallback["change_plan"],
            "media_targeting": response.get("media_targeting") or fallback["media_targeting"],
            "version_strategies": response.get("version_strategies") or fallback["version_strategies"],
        }
    except Exception as exc:
        print(f"Strategic outputs synthesis failed: {exc}")
        return fallback
