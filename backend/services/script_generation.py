from __future__ import annotations

import json
import os
from typing import Any

from config import GROQ_API_KEY
from schemas import script_generation_schema
from services.groq_client import call_groq_chat_json, call_groq_text_completion
from system_prompts import get_script_generation_spec
from utils import round_value, strip_json_wrappers


def _truncate_text(text: str, max_length: int = 2000) -> str:
    """Truncate text to max length, preserving word boundaries."""
    if len(text) <= max_length:
        return text
    truncated = text[:max_length].rsplit(" ", 1)[0]
    return truncated + "..."


def _format_timestamp(second: float) -> str:
    total_seconds = max(0, round(second))
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes}:{seconds:02d}"


def _is_english_language(language: Any) -> bool:
    normalized = str(language or "").strip().lower()
    return normalized.startswith("en")


def _resolve_script_generation_model(default_model: str, model_env_var: str | None) -> str:
    if model_env_var:
        override = os.getenv(model_env_var, "").strip()
        if override:
            return override
    return default_model


def _normalize_beats(
    beats: list[dict[str, Any]],
    duration_seconds: int,
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    last_end = 0.0
    safe_duration = max(float(duration_seconds), 1.0)

    for beat in beats:
        start = float(beat.get("start", last_end))
        end = float(beat.get("end", start + 1.0))
        spoken_line = str(beat.get("spokenLine", "")).strip()
        visual_cue = str(beat.get("visualCue", "")).strip()
        purpose = str(beat.get("purpose", "")).strip()

        start = max(last_end, min(start, safe_duration))
        end = max(start + 0.3, min(end, safe_duration))

        if not spoken_line:
            continue

        normalized.append(
            {
                "start": round_value(start, 1),
                "end": round_value(end, 1),
                "spokenLine": spoken_line,
                "visualCue": visual_cue or "Texto en pantalla reforzando la idea principal",
                "purpose": purpose,
            }
        )
        last_end = end

    if len(normalized) >= 4:
        final_end = normalized[-1]["end"]
        if final_end < safe_duration:
            normalized[-1]["end"] = round_value(safe_duration, 1)

    return normalized


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
    biggest_drop_delta = 0.0
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
        reasons.append(
            {
                "reasonCode": reason.get("reasonCode", ""),
                "reasonLabel": reason.get("reasonLabel", ""),
                "averageDropoffSecond": round_value(float(reason.get("averageDropoffSecond", 0)), 1),
                "example": reason.get("example", ""),
            }
        )

    for diagnosis in segment_diagnoses[: limit - len(reasons)]:
        if not any(r["reasonCode"] == diagnosis.get("reasonCode") for r in reasons):
            reasons.append(
                {
                    "reasonCode": diagnosis.get("reasonCode", ""),
                    "reasonLabel": diagnosis.get("reasonLabel", ""),
                    "averageDropoffSecond": round_value(float(diagnosis.get("dropoffSecond", 0)), 1),
                    "example": diagnosis.get("why", ""),
                }
            )

    return reasons[:limit]


def _build_multimodal_segments(transcript: dict[str, Any], limit: int = 8) -> list[dict[str, Any]]:
    segments = transcript.get("segments", [])
    compact_segments: list[dict[str, Any]] = []

    for segment in segments[:limit]:
        compact_segments.append(
            {
                "start": round_value(float(segment.get("start", 0)), 1),
                "end": round_value(float(segment.get("end", 0)), 1),
                "text": _truncate_text(str(segment.get("text", "")).strip(), 180),
                "visual_description": _truncate_text(str(segment.get("visual_description", "")).strip(), 180),
                "on_screen_text": [str(item).strip() for item in (segment.get("on_screen_text") or [])[:2] if str(item).strip()],
                "creative_signals": [str(item).strip() for item in (segment.get("creative_signals") or [])[:3] if str(item).strip()],
            }
        )

    return compact_segments


def _build_beats_from_segments(
    transcript: dict[str, Any],
    duration_seconds: int,
) -> list[dict[str, Any]]:
    segments = transcript.get("segments", [])
    beats: list[dict[str, Any]] = []

    for segment in segments[:6]:
        start = float(segment.get("start", 0))
        end = float(segment.get("end", start + 1.5))
        text = str(segment.get("text", "")).strip()
        visual_description = str(segment.get("visual_description", "")).strip()
        on_screen_text = ", ".join(
            str(item).strip() for item in (segment.get("on_screen_text") or [])[:2] if str(item).strip()
        )

        if not text:
            continue

        visual_parts = [visual_description, on_screen_text]
        visual_cue = ". ".join(part for part in visual_parts if part).strip()
        beats.append(
            {
                "start": round_value(start, 1),
                "end": round_value(min(max(end, start + 1.2), duration_seconds), 1),
                "spokenLine": text,
                "visualCue": visual_cue or "Refuerzo visual del beneficio con texto en pantalla",
                "purpose": "",
            }
        )

    return _normalize_beats(beats, duration_seconds)


def _build_generic_fallback_beats(
    *,
    duration_seconds: int,
    language: str | None,
    variant: str,
) -> list[dict[str, Any]]:
    safe_duration = max(float(duration_seconds), 6.0)
    intro_end = min(2.0, safe_duration * 0.18)
    setup_end = min(max(intro_end + 2.5, safe_duration * 0.45), safe_duration - 3.6)
    proof_end = min(max(setup_end + 2.2, safe_duration * 0.72), safe_duration - 1.8)
    is_english = _is_english_language(language)

    templates = {
        "A": {
            "hook": (
                "This is the result you want to get much faster."
                if is_english
                else "Este es el resultado que queres conseguir mucho mas rapido."
            ),
            "setup": (
                "Here is the specific shift that makes the whole video land earlier."
                if is_english
                else "Aca esta el cambio puntual que hace que todo el video pegue antes."
            ),
            "proof": (
                "Watch the proof before the explanation so the value is obvious."
                if is_english
                else "Mostra la prueba antes de la explicacion para que el valor quede obvio."
            ),
            "cta": (
                "Save this format and use it on your next edit."
                if is_english
                else "Guarda este formato y usalo en tu proxima edicion."
            ),
        },
        "B": {
            "hook": (
                "Before I explain anything, look at the proof first."
                if is_english
                else "Antes de explicarte nada, mira primero la prueba."
            ),
            "setup": (
                "This is the moment that makes the claim believable right away."
                if is_english
                else "Este es el momento que vuelve creible el claim desde el arranque."
            ),
            "proof": (
                "Now connect that proof to the promise so the story feels earned."
                if is_english
                else "Ahora conecta esa prueba con la promesa para que el relato se sienta ganado."
            ),
            "cta": (
                "Keep this structure if you want higher watch time on the next version."
                if is_english
                else "Usa esta estructura si queres mas tiempo de visualizacion en la proxima version."
            ),
        },
        "C": {
            "hook": (
                "This was losing attention until this one change fixed the opening."
                if is_english
                else "Esto perdia atencion hasta que este cambio arreglo la apertura."
            ),
            "setup": (
                "Set up the tension quickly, then pay it off before the viewer drifts."
                if is_english
                else "Plantea la tension rapido y resolvela antes de que el viewer se vaya."
            ),
            "proof": (
                "Use one clear visual beat to show that the change really works."
                if is_english
                else "Usa un beat visual claro para demostrar que el cambio realmente funciona."
            ),
            "cta": (
                "Save it now and adapt this script to your next cut."
                if is_english
                else "Guardalo ahora y adapta este guion a tu proximo corte."
            ),
        },
    }
    copy = templates.get(variant, templates["A"])
    visual_copy = {
        "hook": (
            "Open on the final result, large headline on screen"
            if is_english
            else "Abrir con el resultado final y titular grande en pantalla"
        ),
        "setup": (
            "Fast cut showing the key action or setup beat"
            if is_english
            else "Corte rapido mostrando la accion clave o el setup"
        ),
        "proof": (
            "Proof on screen, metric, demo, before/after, or visible outcome"
            if is_english
            else "Prueba en pantalla, metrica, demo, antes/despues o resultado visible"
        ),
        "cta": (
            "Clear CTA on screen with one simple motion cue"
            if is_english
            else "CTA claro en pantalla con una accion simple"
        ),
    }

    return _normalize_beats(
        [
            {
                "start": 0.0,
                "end": intro_end,
                "spokenLine": copy["hook"],
                "visualCue": visual_copy["hook"],
                "purpose": "hook",
            },
            {
                "start": intro_end,
                "end": setup_end,
                "spokenLine": copy["setup"],
                "visualCue": visual_copy["setup"],
                "purpose": "desarrollo",
            },
            {
                "start": setup_end,
                "end": proof_end,
                "spokenLine": copy["proof"],
                "visualCue": visual_copy["proof"],
                "purpose": "prueba",
            },
            {
                "start": proof_end,
                "end": safe_duration,
                "spokenLine": copy["cta"],
                "visualCue": visual_copy["cta"],
                "purpose": "cta",
            },
        ],
        duration_seconds,
    )


def _default_creative_scripts(
    target_audience: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
    change_plan: dict[str, Any],
) -> list[dict[str, Any]]:
    """Generate default creative scripts when LLM fails."""
    primary = target_audience.get("primaryAudience", "Audiencia principal")
    secondary = target_audience.get("secondaryAudience", "Audiencia secundaria")
    hobby_target = (
        (target_audience.get("topHobbies") or [{}])[0].get("label")
        or "Audiencia que responde a relatos con payoff claro"
    )
    language = str(transcript.get("language", "")).strip()
    major_drop = change_plan.get("biggestDropSecond")
    silent_cut = change_plan.get("silentIntroCutSeconds")
    fixes = [item.get("fix", "") for item in change_plan.get("actions", []) if item.get("fix")]

    def decorate_beats(
        variant: str,
    ) -> list[dict[str, Any]]:
        return _build_generic_fallback_beats(
            duration_seconds=duration_seconds,
            language=language,
            variant=variant,
        )

    common_issue = fixes[0] if fixes else "Mostrar el valor antes y sumar prueba visible en la mitad del video."
    timing_note = (
        f"Corrige la mayor caida cerca de {_format_timestamp(float(major_drop))}."
        if isinstance(major_drop, (int, float))
        else "Corrige el punto principal de abandono detectado en la curva."
    )
    silent_note = (
        f"Tambien elimina una apertura muerta de {_format_timestamp(float(silent_cut))}."
        if isinstance(silent_cut, (int, float)) and float(silent_cut) > 0
        else "Tambien acelera la entrada para que el hook llegue antes."
    )

    return [
        {
            "id": "A",
            "name": "Guion A",
            "targetAudience": primary,
            "hookAngle": (
                "Open with the result and benefit in the first frame."
                if _is_english_language(language)
                else "Abrir con resultado y beneficio en el primer frame."
            ),
            "whyItWorks": f"{timing_note} {silent_note}",
            "addressedIssues": ["hook debil", "intro lenta", "claridad tardia"],
            "beats": decorate_beats("A"),
        },
        {
            "id": "B",
            "name": "Guion B",
            "targetAudience": secondary,
            "hookAngle": (
                "Open with visible proof to remove skepticism early."
                if _is_english_language(language)
                else "Abrir con prueba visible para bajar escepticismo rapido."
            ),
            "whyItWorks": f"{common_issue} Mete prueba antes de que la audiencia cuestione el claim.",
            "addressedIssues": ["falta de prueba", "escepticismo", "cta tardio"],
            "beats": decorate_beats("B"),
        },
        {
            "id": "C",
            "name": "Guion C",
            "targetAudience": hobby_target,
            "hookAngle": (
                "Open with narrative tension and a clear payoff."
                if _is_english_language(language)
                else "Abrir con tension narrativa y payoff claro al final."
            ),
            "whyItWorks": (
                "It keeps curiosity high while restructuring the story so every beat pulls to the next."
                if _is_english_language(language)
                else "Mantiene la curiosidad alta mientras reordena la historia para que cada beat empuje al siguiente."
            ),
            "addressedIssues": ["ritmo irregular", "falta de tension", "payoff debil"],
            "beats": decorate_beats("C"),
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
    fallback = _default_creative_scripts(target_audience, transcript, duration_seconds, change_plan)

    if not GROQ_API_KEY:
        return fallback

    retention_summary = _build_retention_curve_summary(average_line, duration_seconds)
    top_leave_reasons = _extract_top_leave_reasons(segment_diagnoses, change_plan)

    prompt_payload = {
        "duration_seconds": duration_seconds,
        "transcript_language": transcript.get("language"),
        "transcript_text": _truncate_text(transcript_text, 1800),
        "transcript_segments": _build_multimodal_segments(transcript),
        "creative_context": {
            "overall_score": creative_context.get("overall_score"),
            "hook_score": creative_context.get("hook_score"),
            "clarity_score": creative_context.get("clarity_score"),
            "pacing_score": creative_context.get("pacing_score"),
            "cta_score": creative_context.get("cta_score"),
            "visual_score": creative_context.get("visual_score"),
            "primary_angle": creative_context.get("primary_angle"),
            "strongest_points": creative_context.get("strongest_points", [])[:3],
            "weaknesses": creative_context.get("weaknesses", [])[:4],
        },
        "target_audience": {
            "primaryAudience": target_audience.get("primaryAudience"),
            "secondaryAudience": target_audience.get("secondaryAudience"),
            "topHobbies": [item.get("label") for item in (target_audience.get("topHobbies") or [])[:3]],
            "topNiches": [item.get("label") for item in (target_audience.get("topNiches") or [])[:3]],
        },
        "top_leave_reasons": top_leave_reasons,
        "change_plan": {
            "silentIntroCutSeconds": change_plan.get("silentIntroCutSeconds"),
            "biggestDropSecond": change_plan.get("biggestDropSecond"),
            "cta": change_plan.get("cta"),
            "actions": [
                {
                    "title": action.get("title"),
                    "timestamp": action.get("timestamp"),
                    "reason": action.get("reason"),
                    "fix": action.get("fix"),
                }
                for action in change_plan.get("actions", [])[:5]
            ],
            "reasonFixes": change_plan.get("reasonFixes", [])[:4],
        },
        "retention_curve_summary": retention_summary,
        "instruction": (
            "Escribe 3 guiones nuevos del mismo largo aproximado que el video original. "
            "A debe priorizar hook de beneficio inmediato. "
            "B debe priorizar prueba y credibilidad temprana. "
            "C debe priorizar tension narrativa con payoff claro. "
            "Cada beat debe poder leerse como una linea grabable seguida de una instruccion visual clara."
        ),
    }

    resolved_model = _resolve_script_generation_model(spec.default_model, spec.model_env_var)
    request_messages = [
        {
            "role": "system",
            "content": spec.system_prompt,
        },
        {
            "role": "user",
            "content": json.dumps(prompt_payload, ensure_ascii=False),
        },
    ]

    response: dict[str, Any] | None = None
    try:
        response = await call_groq_chat_json(
            messages=request_messages,
            schema_name=spec.schema_name,
            schema=script_generation_schema(),
            strict=spec.strict_json_schema,
            model=resolved_model,
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )
    except Exception as exc:
        print(f"Script generation JSON mode failed: {exc}")

    if not response or not response.get("scripts"):
        try:
            text_response = await call_groq_text_completion(
                messages=[
                    *request_messages,
                    {
                        "role": "user",
                        "content": (
                            "Devuelve solo un objeto JSON valido, sin markdown ni texto extra, "
                            f"que cumpla exactamente este schema: {json.dumps(script_generation_schema(), ensure_ascii=False)}"
                        ),
                    },
                ],
                model=resolved_model,
                temperature=spec.temperature,
                timeout_seconds=spec.timeout_seconds,
            )
            if text_response:
                response = json.loads(strip_json_wrappers(text_response))
        except Exception as exc:
            print(f"Script generation text fallback failed: {exc}")

    if not response or not response.get("scripts"):
        return fallback

    scripts = response.get("scripts", [])
    if len(scripts) != 3:
        return fallback

    normalized_scripts: list[dict[str, Any]] = []
    for script in scripts:
        beats = _normalize_beats(script.get("beats", []), duration_seconds)
        if len(beats) < 3:
            return fallback
        normalized_scripts.append(
            {
                "id": str(script.get("id", "")).strip() or "A",
                "name": str(script.get("name", "")).strip() or "Guion",
                "targetAudience": str(script.get("targetAudience", "")).strip() or target_audience.get("primaryAudience", "Audiencia principal"),
                "hookAngle": str(script.get("hookAngle", "")).strip() or "Hook mas claro y mas rapido",
                "whyItWorks": str(script.get("whyItWorks", "")).strip() or "Corrige los principales puntos de fuga detectados.",
                "addressedIssues": [
                    str(issue).strip()
                    for issue in script.get("addressedIssues", [])
                    if str(issue).strip()
                ],
                "beats": beats,
            }
        )

    return normalized_scripts
