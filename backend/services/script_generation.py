from __future__ import annotations

import json
from typing import Any

from config import GROQ_API_KEY, resolve_prompt_model
from schemas import script_generation_schema
from services.groq_client import call_groq_chat_json
from system_prompts import get_script_generation_spec
from utils import round_value


def _truncate_text(text: str, max_length: int = 2000) -> str:
    """Truncate text to max length, preserving word boundaries."""
    if len(text) <= max_length:
        return text
    truncated = text[:max_length].rsplit(" ", 1)[0]
    return truncated + "..."


def _build_retention_curve_summary(
    average_line: list[dict[str, Any]],
    duration_seconds: int,
) -> dict[str, Any]:
    """Build a compact summary of the retention curve."""
    if not average_line:
        return {
            "biggest_drop_second": None,
            "retention_at_25_percent": None,
            "retention_at_50_percent": None,
            "retention_at_75_percent": None,
        }

    biggest_drop_second = 0
    biggest_drop_delta = 0
    for i in range(1, len(average_line)):
        prev = average_line[i - 1]
        curr = average_line[i]
        delta = float(prev.get("retention", 100)) - float(curr.get("retention", 100))
        if delta > biggest_drop_delta:
            biggest_drop_delta = delta
            biggest_drop_second = int(curr.get("second", i))

    def get_retention_at_percent(target_percent: float) -> float | None:
        target_second = duration_seconds * target_percent
        for point in average_line:
            if float(point.get("second", 0)) >= target_second:
                return round_value(float(point.get("retention", 0)), 1)
        return None

    return {
        "biggest_drop_second": biggest_drop_second,
        "retention_at_25_percent": get_retention_at_percent(0.25),
        "retention_at_50_percent": get_retention_at_percent(0.50),
        "retention_at_75_percent": get_retention_at_percent(0.75),
    }


def _extract_top_leave_reasons(
    segment_diagnoses: list[dict[str, Any]],
    change_plan: dict[str, Any],
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Extract top reasons why people leave from diagnoses and change plan."""
    reasons: list[dict[str, Any]] = []

    top_leave_reasons = change_plan.get("topLeaveReasons", [])
    for reason in top_leave_reasons[:limit]:
        reasons.append({
            "reasonCode": reason.get("reasonCode", ""),
            "reasonLabel": reason.get("reasonLabel", ""),
            "averageDropoffSecond": round_value(float(reason.get("averageDropoffSecond", 0)), 1),
            "example": reason.get("example", ""),
        })

    for diagnosis in segment_diagnoses[:limit - len(reasons)]:
        if not any(r["reasonCode"] == diagnosis.get("reasonCode") for r in reasons):
            reasons.append({
                "reasonCode": diagnosis.get("reasonCode", ""),
                "reasonLabel": diagnosis.get("reasonLabel", ""),
                "averageDropoffSecond": round_value(float(diagnosis.get("dropoffSecond", 0)), 1),
                "example": diagnosis.get("why", ""),
            })

    return reasons[:limit]


def _default_creative_scripts(
    target_audience: dict[str, Any],
    transcript_text: str,
) -> list[dict[str, Any]]:
    """Generate default creative scripts when LLM fails."""
    primary = target_audience.get("primaryAudience", "Audiencia principal")
    secondary = target_audience.get("secondaryAudience", "Audiencia secundaria")

    base_text = _truncate_text(transcript_text, 100) or "tu producto o servicio"

    return [
        {
            "id": "A",
            "name": "Guion A: Hook Directo",
            "targetAudience": primary,
            "strategy": "Abre con el resultado o beneficio principal desde el primer segundo. Sin introducciones, directo al grano.",
            "script": {
                "hook": {
                    "text": f"Esto es lo que nadie te dice sobre {base_text}",
                    "visualCue": "Primer plano del resultado o transformacion",
                    "duration": "0s - 3s",
                },
                "development": {
                    "text": "En solo 3 pasos podes lograr lo mismo que el resto tarda semanas en conseguir",
                    "visualCue": "Transicion rapida mostrando el proceso",
                    "duration": "3s - 10s",
                },
                "proof": {
                    "text": "Mira los resultados de quienes ya lo probaron",
                    "visualCue": "Screenshots o testimonios visuales",
                    "duration": "10s - 14s",
                },
                "cta": {
                    "text": "Guarda este video y empeza hoy",
                    "visualCue": "Call to action en pantalla con gesto de guardar",
                    "duration": "14s - 17s",
                },
            },
            "fullScript": "Esto es lo que nadie te dice... En solo 3 pasos podes lograr lo mismo. Mira los resultados. Guarda este video y empeza hoy.",
            "expectedRetention": "Mejor retencion en primeros 3 segundos por hook directo",
            "whyItWorks": "El beneficio aparece inmediatamente, capturando atencion antes del primer swipe.",
            "addressedIssues": ["intro_too_slow", "hook_weak"],
        },
        {
            "id": "B",
            "name": "Guion B: Proof-Led",
            "targetAudience": secondary,
            "strategy": "Abre con evidencia o prueba concreta. Construye credibilidad desde el inicio.",
            "script": {
                "hook": {
                    "text": "Este es el resultado despues de solo 7 dias",
                    "visualCue": "Resultado tangible en pantalla",
                    "duration": "0s - 3s",
                },
                "development": {
                    "text": "Te muestro exactamente como lo logre paso a paso",
                    "visualCue": "Demostracion del proceso en accion",
                    "duration": "3s - 10s",
                },
                "proof": {
                    "text": "Aca tenes los numeros que comprueban que funciona",
                    "visualCue": "Metricas o datos en pantalla",
                    "duration": "10s - 14s",
                },
                "cta": {
                    "text": "Segui para el tutorial completo",
                    "visualCue": "Boton de seguir con animacion",
                    "duration": "14s - 17s",
                },
            },
            "fullScript": "Este es el resultado despues de 7 dias. Te muestro como lo logre. Aca tenes los numeros. Segui para el tutorial completo.",
            "expectedRetention": "Mayor credibilidad inmediata reduce abandono por escepticismo",
            "whyItWorks": "La prueba temprana elimina objeciones antes de que el espectador decida irse.",
            "addressedIssues": ["claim_lacks_proof", "message_unclear"],
        },
        {
            "id": "C",
            "name": "Guion C: Story-Driven",
            "targetAudience": "Audiencias orientadas a storytelling",
            "strategy": "Estructura narrativa con tension y resolucion. Conecta emocionalmente.",
            "script": {
                "hook": {
                    "text": "Estaba a punto de rendirme cuando descubri esto",
                    "visualCue": "Expresion facial de frustracion seguida de sorpresa",
                    "duration": "0s - 3s",
                },
                "development": {
                    "text": "Durante meses intente de todo sin resultados, hasta que encontre este metodo",
                    "visualCue": "Montaje de intentos fallidos y el momento del descubrimiento",
                    "duration": "3s - 10s",
                },
                "proof": {
                    "text": "Ahora ayudo a otros a evitar los mismos errores",
                    "visualCue": "Comunidad o testimonios de otros usuarios",
                    "duration": "10s - 14s",
                },
                "cta": {
                    "text": "Comenta 'quiero' y te cuento como empezar",
                    "visualCue": "Texto de engagement con animacion",
                    "duration": "14s - 17s",
                },
            },
            "fullScript": "Estaba a punto de rendirme cuando descubri esto. Durante meses intente de todo. Ahora ayudo a otros. Comenta 'quiero' y te cuento como.",
            "expectedRetention": "Conexion emocional sostiene atencion durante todo el video",
            "whyItWorks": "La estructura narrativa genera curiosidad por saber como termina la historia.",
            "addressedIssues": ["pacing_uneven", "no_emotional_hook"],
        },
    ]


async def generate_creative_scripts(
    *,
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
    average_line: list[dict[str, Any]],
    segment_diagnoses: list[dict[str, Any]],
    change_plan: dict[str, Any],
) -> list[dict[str, Any]]:
    """Generate 3 creative scripts based on video analysis."""
    spec = get_script_generation_spec()
    transcript_text = str(transcript.get("text", ""))
    fallback = _default_creative_scripts(target_audience, transcript_text)

    if not GROQ_API_KEY:
        return fallback

    retention_summary = _build_retention_curve_summary(average_line, duration_seconds)
    top_leave_reasons = _extract_top_leave_reasons(segment_diagnoses, change_plan)

    prompt_payload = {
        "duration_seconds": duration_seconds,
        "transcript_text": _truncate_text(transcript_text, 2000),
        "creative_context": {
            "overall_score": creative_context.get("overall_score"),
            "hook_score": creative_context.get("hook_score"),
            "clarity_score": creative_context.get("clarity_score"),
            "pacing_score": creative_context.get("pacing_score"),
            "cta_score": creative_context.get("cta_score"),
            "strongest_points": creative_context.get("strongest_points", [])[:3],
            "weaknesses": creative_context.get("weaknesses", [])[:3],
        },
        "target_audience": {
            "primaryAudience": target_audience.get("primaryAudience"),
            "secondaryAudience": target_audience.get("secondaryAudience"),
        },
        "top_leave_reasons": top_leave_reasons,
        "retention_curve_summary": retention_summary,
        "instruction": (
            "Genera 3 guiones completos y listos para grabar basados en este analisis. "
            "Guion A debe usar estrategia de Hook Directo (abrir con resultado/beneficio). "
            "Guion B debe usar estrategia Proof-Led (abrir con prueba/evidencia). "
            "Guion C debe usar estrategia Story-Driven (estructura narrativa con tension). "
            "Cada guion debe resolver al menos uno de los problemas identificados en top_leave_reasons. "
            "El texto debe ser exacto y grabable, sin placeholders."
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
                    "content": json.dumps(prompt_payload, ensure_ascii=False),
                },
            ],
            schema_name=spec.schema_name,
            schema=script_generation_schema(),
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )

        if not response or not response.get("scripts"):
            return fallback

        scripts = response.get("scripts", [])
        if len(scripts) != 3:
            return fallback

        return scripts

    except Exception as exc:
        print(f"Script generation failed: {exc}")
        return fallback
