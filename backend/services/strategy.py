from __future__ import annotations

import json
import re
from typing import Any

from config import GROQ_API_KEY, resolve_prompt_model
from schemas import final_copy_schema, strategic_outputs_schema
from services.groq_client import call_groq_chat_json, call_groq_text_completion
from services.retention import build_platform_fit_rows
from system_prompts import FINAL_COPY_SPEC, get_strategic_outputs_spec, get_video_summary_spec
from utils import round_value, summary_has_placeholder_text


def build_transcript_grounded_summary(
    transcript: dict[str, Any],
    creative_context: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str]:
    """Build a grounded summary from transcript."""
    segment_text = [
        str(segment.get("text", "")).strip()
        for segment in transcript.get("segments", [])
        if str(segment.get("text", "")).strip()
    ]
    summary_core = " ".join(segment_text[:3]).strip()
    if not summary_core:
        summary_core = str(transcript.get("text", "")).strip()
    summary_core = re.sub(r"\s+", " ", summary_core).strip()
    if len(summary_core) > 520:
        summary_core = summary_core[:517].rstrip() + "..."

    strongest_points = creative_context.get("strongest_points", [])
    weaknesses = creative_context.get("weaknesses", [])
    strengths_text = "; ".join(str(point) for point in strongest_points[:2]) or "La promesa principal se entiende cuando aparece el beneficio."
    weaknesses_text = "; ".join(str(point) for point in weaknesses[:2]) or "La apertura todavia tarda en llegar al payoff."

    video_summary = (
        f"En este video de {duration_seconds}s, el mensaje se desarrolla asi: {summary_core} "
        f"Fortalezas: {strengths_text}. "
        f"Debilidades: {weaknesses_text}."
    )
    first_sentence = re.split(r"(?<=[.!?])\s+", video_summary, maxsplit=1)[0].strip()
    return {
        "video_summary": video_summary,
        "summary_narrative": first_sentence or video_summary,
    }


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
    target_audience: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str] | None:
    """Synthesize video summary using Groq LLM."""
    if not GROQ_API_KEY:
        return None

    try:
        spec = get_video_summary_spec()
        summary_text = await call_groq_text_completion(
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
                            "target_audience": target_audience,
                            "transcript": transcript,
                            "duration_seconds": duration_seconds,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
        )
        if not summary_text:
            return None
        if summary_has_placeholder_text(summary_text):
            return None
        first_sentence = re.split(r"(?<=[.!?])\s+", summary_text.strip(), maxsplit=1)[0].strip()
        return {
            "video_summary": summary_text,
            "summary_narrative": first_sentence or summary_text,
        }
    except Exception:
        return None


async def synthesize_final_copy(
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    personas: list[dict[str, Any]],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    """Synthesize final copy using Groq LLM."""
    spec = FINAL_COPY_SPEC
    fallback = default_final_copy(creative_context, target_audience, duration_seconds)
    grounded_summary = build_transcript_grounded_summary(transcript, creative_context, duration_seconds)
    fallback["video_summary"] = grounded_summary["video_summary"]
    fallback["summary_narrative"] = grounded_summary["summary_narrative"]
    summary_response = await synthesize_video_summary(creative_context, target_audience, transcript, duration_seconds)
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
        )
        if not response:
            return fallback
        merged = {**fallback, **response}
        merged["recommendations"] = response.get("recommendations") or fallback["recommendations"]
        merged["ad_strategy"] = response.get("ad_strategy") or fallback["ad_strategy"]
        merged["platforms"] = response.get("platforms") or fallback["platforms"]
        if summary_response and not summary_has_placeholder_text(summary_response.get("video_summary", "")):
            merged["video_summary"] = summary_response["video_summary"]
            merged["summary_narrative"] = summary_response["summary_narrative"]
        elif summary_has_placeholder_text(str(merged.get("video_summary", ""))):
            merged["video_summary"] = grounded_summary["video_summary"]
            merged["summary_narrative"] = grounded_summary["summary_narrative"]
        return merged
    except Exception:
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
        )
        if not response:
            return fallback
        return {
            "change_plan": response.get("change_plan") or fallback["change_plan"],
            "media_targeting": response.get("media_targeting") or fallback["media_targeting"],
            "version_strategies": response.get("version_strategies") or fallback["version_strategies"],
        }
    except Exception:
        return fallback
