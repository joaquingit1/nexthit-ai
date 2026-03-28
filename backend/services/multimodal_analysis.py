from __future__ import annotations

from typing import Any

from config import resolve_gemini_model
from schemas import multimodal_timeline_schema, video_creative_analysis_schema
from services.gemini_client import (
    call_gemini_video_json,
    upload_video_to_gemini,
    wait_for_gemini_file_active,
)
from system_prompts import MULTIMODAL_TIMELINE_SPEC, VIDEO_CREATIVE_ANALYSIS_SPEC
from utils import clamp, round_value


def _default_visual_description(segment: dict[str, Any]) -> str:
    text = str(segment.get("text", "")).strip()
    if text:
        return "Se ve un tramo de video que acompana el mensaje hablado, sin una prueba visual especialmente clara."
    return "No se pudo describir con precision el contenido visual de este tramo."


def _default_timeline_insights(duration_seconds: int) -> list[dict[str, Any]]:
    safe_duration = max(duration_seconds, 1)
    return [
        {
            "id": "hook",
            "label": "Hook visual",
            "second": 1.1,
            "detail": "La apertura define si el beneficio se entiende con solo mirar los primeros frames.",
            "tone": "risk",
        },
        {
            "id": "energy",
            "label": "Caida de ritmo",
            "second": round_value(safe_duration * 0.4, 1),
            "detail": "En este punto suele verse si el montaje escala o se vuelve plano.",
            "tone": "risk",
        },
        {
            "id": "overload",
            "label": "Sobrecarga",
            "second": round_value(safe_duration * 0.68, 1),
            "detail": "Aca puede acumularse demasiada informacion visual o verbal al mismo tiempo.",
            "tone": "risk",
        },
        {
            "id": "loop",
            "label": "Potencial de loop",
            "second": round_value(max(safe_duration - 1.6, 0.8), 1),
            "detail": "El cierre puede reforzar replay si espeja la promesa inicial.",
            "tone": "opportunity",
        },
    ]


def _normalize_timeline_insights(
    raw_items: list[dict[str, Any]] | None,
    duration_seconds: int,
) -> list[dict[str, Any]]:
    fallback_by_id = {item["id"]: item for item in _default_timeline_insights(duration_seconds)}
    normalized: dict[str, dict[str, Any]] = {}
    for item in raw_items or []:
        raw_id = str(item.get("id", "")).strip().lower()
        if raw_id not in fallback_by_id:
            continue
        normalized[raw_id] = {
            "id": raw_id,
            "label": str(item.get("label", fallback_by_id[raw_id]["label"])).strip()
            or fallback_by_id[raw_id]["label"],
            "second": round_value(
                clamp(float(item.get("second", fallback_by_id[raw_id]["second"]) or fallback_by_id[raw_id]["second"]), 0, max(duration_seconds, 1)),
                1,
            ),
            "detail": str(item.get("detail", fallback_by_id[raw_id]["detail"])).strip()
            or fallback_by_id[raw_id]["detail"],
            "tone": item.get("tone") if item.get("tone") in {"risk", "opportunity"} else fallback_by_id[raw_id]["tone"],
        }
    for insight_id, fallback in fallback_by_id.items():
        normalized.setdefault(insight_id, fallback)
    return [normalized[key] for key in ["hook", "energy", "overload", "loop"]]


def normalize_multimodal_timeline(
    transcript: dict[str, Any],
    payload: dict[str, Any] | None,
    duration_seconds: int,
) -> dict[str, Any]:
    raw_segments = payload.get("segments", []) if payload else []
    raw_by_index = {
        int(item.get("index", index)): item
        for index, item in enumerate(raw_segments)
        if isinstance(item, dict)
    }
    enriched_segments: list[dict[str, Any]] = []

    for index, segment in enumerate(transcript.get("segments", [])):
        raw = raw_by_index.get(index, {})
        start = round_value(clamp(float(segment.get("start", 0) or 0), 0, max(duration_seconds, 1)), 2)
        end = round_value(
            clamp(float(segment.get("end", start) or start), start, max(duration_seconds, 1)),
            2,
        )
        visual_description = str(raw.get("visual_description", "")).strip() or _default_visual_description(segment)
        scene_labels = [str(item).strip() for item in raw.get("scene_labels", []) if str(item).strip()][:4]
        on_screen_text = [str(item).strip() for item in raw.get("on_screen_text", []) if str(item).strip()][:4]
        creative_signals = [str(item).strip().lower() for item in raw.get("creative_signals", []) if str(item).strip()][:6]
        retention_impact = str(raw.get("retention_impact", "neutral")).strip().lower()
        if retention_impact not in {"positive", "neutral", "negative"}:
            retention_impact = "neutral"
        visual_confidence = round_value(
            clamp(float(raw.get("visual_confidence", 0.55) or 0.55), 0, 1),
            2,
        )

        enriched_segments.append(
            {
                **segment,
                "start": start,
                "end": end if end > start else round_value(min(max(duration_seconds, 1), start + 0.2), 2),
                "visual_description": visual_description,
                "scene_labels": scene_labels,
                "on_screen_text": on_screen_text,
                "creative_signals": creative_signals,
                "retention_impact": retention_impact,
                "visual_confidence": visual_confidence,
            }
        )

    return {
        **transcript,
        "segments": enriched_segments,
        "multimodal_source": "gemini",
    }


def _default_video_summary(transcript: dict[str, Any]) -> str:
    segments = transcript.get("segments", [])
    if not segments:
        return (
            "El video intenta introducir una promesa de valor, pero el material disponible no alcanza para describir "
            "de forma confiable como evoluciona visualmente de principio a fin."
        )
    opening = segments[0]
    middle = segments[min(len(segments) // 2, len(segments) - 1)]
    closing = segments[-1]
    opening_visual = str(opening.get("visual_description", "")).strip().lower()
    middle_visual = str(middle.get("visual_description", "")).strip().lower()
    closing_visual = str(closing.get("visual_description", "")).strip().lower()
    return (
        f"El video abre con {opening_visual or 'una apertura rapida que introduce la idea principal'}. "
        f"En la parte media muestra {middle_visual or 'el desarrollo del mensaje y su beneficio'}. "
        f"Cierra con {closing_visual or 'un remate que intenta sostener la propuesta de valor'}. "
        "La lectura creativa depende sobre todo de si esa progresion visual logra volver concreta la promesa antes de la primera gran decision de abandono."
    )


def normalize_video_analysis(
    video_id: str,
    transcript: dict[str, Any],
    payload: dict[str, Any] | None,
    duration_seconds: int,
    preferred_platform: str | None,
    source_model: str,
) -> dict[str, Any]:
    scores = payload.get("scores", {}) if payload else {}

    def score(name: str, fallback: int) -> int:
        return int(clamp(round(float(scores.get(name, fallback) or fallback)), 0, 100))

    normalized = {
        "summary": str(payload.get("summary", "")).strip() if payload else "",
        "hook": str(payload.get("hook", "")).strip() if payload else "",
        "visual_style": str(payload.get("visual_style", "")).strip() if payload else "",
        "pacing_notes": str(payload.get("pacing_notes", "")).strip() if payload else "",
        "on_screen_text_notes": str(payload.get("on_screen_text_notes", "")).strip() if payload else "",
        "cta_notes": str(payload.get("cta_notes", "")).strip() if payload else "",
        "overall_label": str(payload.get("overall_label", "")).strip() if payload else "",
        "narrative": str(payload.get("narrative", "")).strip() if payload else "",
        "strongest_points": [str(item).strip() for item in (payload.get("strongest_points", []) if payload else []) if str(item).strip()][:4],
        "weaknesses": [str(item).strip() for item in (payload.get("weaknesses", []) if payload else []) if str(item).strip()][:4],
        "creative_fixes": [str(item).strip() for item in (payload.get("creative_fixes", []) if payload else []) if str(item).strip()][:5],
        "best_platform": str(payload.get("best_platform", preferred_platform or "TikTok")).strip() if payload else (preferred_platform or "TikTok"),
        "primary_angle": str(payload.get("primary_angle", "")).strip() if payload else "",
        "timeline_insights": _normalize_timeline_insights(payload.get("timeline_insights") if payload else None, duration_seconds),
        "key_moments": _normalize_timeline_insights(payload.get("key_moments") if payload else None, duration_seconds),
        "scores": {
            "overall_score": score("overall_score", 76),
            "hook_score": score("hook_score", 74),
            "clarity_score": score("clarity_score", 73),
            "pacing_score": score("pacing_score", 71),
            "audio_score": score("audio_score", 68),
            "visual_score": score("visual_score", 82),
            "novelty_score": score("novelty_score", 72),
            "cta_score": score("cta_score", 66),
            "platform_fit_score": score("platform_fit_score", 78),
            "viral_score": score("viral_score", 75),
            "conversion_score": score("conversion_score", 69),
            "ad_readiness_score": score("ad_readiness_score", 74),
        },
        "source_model": source_model,
        "id": f"creative-{video_id}",
        "video_id": video_id,
    }

    if not normalized["summary"]:
        normalized["summary"] = _default_video_summary(transcript)
    if not normalized["hook"]:
        normalized["hook"] = "La primera impresion depende sobre todo de la lectura visual del primer beat."
    if not normalized["visual_style"]:
        normalized["visual_style"] = "La pieza combina imagen, mensaje hablado y ritmo de montaje para instalar la promesa."
    if not normalized["pacing_notes"]:
        normalized["pacing_notes"] = "El ritmo sostiene mejor cuando la imagen demuestra antes de explicar."
    if not normalized["on_screen_text_notes"]:
        normalized["on_screen_text_notes"] = "El texto en pantalla deberia reforzar el beneficio o la prueba principal."
    if not normalized["cta_notes"]:
        normalized["cta_notes"] = "La llamada a la accion funciona mejor cuando queda cerca del mayor momento de prueba."
    if not normalized["overall_label"]:
        normalized["overall_label"] = "Buen potencial creativo, con margen claro para mejorar el hook visual."
    if not normalized["narrative"]:
        normalized["narrative"] = normalized["summary"].split(" Fortalezas:", 1)[0].strip()
    if not normalized["strongest_points"]:
        normalized["strongest_points"] = [
            "La lectura visual principal se entiende rapidamente cuando aparece la promesa.",
            "El video ofrece material para paid social si la prueba entra antes.",
            f"{normalized['best_platform']} aparece como el mejor encaje inicial de distribucion.",
        ]
    if not normalized["weaknesses"]:
        normalized["weaknesses"] = [
            "La pieza puede perder atencion antes de aterrizar la promesa con suficiente claridad.",
            "La prueba visual necesita aparecer antes en el recorrido.",
            "El CTA debe acercarse mas al mayor momento de valor.",
        ]
    if not normalized["creative_fixes"]:
        normalized["creative_fixes"] = [
            "Mostra el payoff visual antes de la explicacion.",
            "Recorta cualquier setup que no agregue claridad.",
            "Pega la prueba y el CTA a la misma ventana de atencion.",
        ]

    return normalized


async def prepare_gemini_video(file_path: str, mime_type: str | None) -> dict[str, Any]:
    uploaded = await upload_video_to_gemini(file_path, mime_type)
    return await wait_for_gemini_file_active(uploaded["name"])


async def build_multimodal_timeline(
    *,
    uploaded_file: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> dict[str, Any]:
    payload = await call_gemini_video_json(
        uploaded_file=uploaded_file,
        system_prompt=MULTIMODAL_TIMELINE_SPEC.system_prompt,
        prompt_payload={
            "duration_seconds": duration_seconds,
            "instruction": (
                "Enriquece cada segmento del transcript con una descripcion visual breve, texto en pantalla si existe, "
                "senales creativas y el impacto esperado sobre retencion."
            ),
            "segments": [
                {
                    "index": index,
                    "start": segment.get("start"),
                    "end": segment.get("end"),
                    "text": segment.get("text"),
                }
                for index, segment in enumerate(transcript.get("segments", []))
            ],
        },
        schema=multimodal_timeline_schema(),
        default_model=MULTIMODAL_TIMELINE_SPEC.default_model,
        model_env_var=MULTIMODAL_TIMELINE_SPEC.model_env_var,
        temperature=MULTIMODAL_TIMELINE_SPEC.temperature,
        timeout_seconds=MULTIMODAL_TIMELINE_SPEC.timeout_seconds,
    )
    return normalize_multimodal_timeline(transcript, payload, duration_seconds)


async def build_video_creative_analysis(
    *,
    video_id: str,
    uploaded_file: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
    preferred_platform: str | None,
) -> dict[str, Any]:
    payload = await call_gemini_video_json(
        uploaded_file=uploaded_file,
        system_prompt=VIDEO_CREATIVE_ANALYSIS_SPEC.system_prompt,
        prompt_payload={
            "video_id": video_id,
            "duration_seconds": duration_seconds,
            "preferred_platform": preferred_platform,
            "instruction": (
                "Analiza este video como un creativo de paid social. "
                "Usa tanto lo que se dice como lo que se ve. "
                "El summary debe narrar que ocurre en el video de inicio a fin, de forma verificable y util para un jurado."
            ),
            "transcript": {
                "text": transcript.get("text"),
                "language": transcript.get("language"),
                "segments": [
                    {
                        "start": segment.get("start"),
                        "end": segment.get("end"),
                        "text": segment.get("text"),
                        "visual_description": segment.get("visual_description"),
                        "scene_labels": segment.get("scene_labels", []),
                        "on_screen_text": segment.get("on_screen_text", []),
                        "creative_signals": segment.get("creative_signals", []),
                        "retention_impact": segment.get("retention_impact"),
                    }
                    for segment in transcript.get("segments", [])
                ],
            },
        },
        schema=video_creative_analysis_schema(),
        default_model=VIDEO_CREATIVE_ANALYSIS_SPEC.default_model,
        model_env_var=VIDEO_CREATIVE_ANALYSIS_SPEC.model_env_var,
        temperature=VIDEO_CREATIVE_ANALYSIS_SPEC.temperature,
        timeout_seconds=VIDEO_CREATIVE_ANALYSIS_SPEC.timeout_seconds,
    )
    return normalize_video_analysis(
        video_id,
        transcript,
        payload,
        duration_seconds,
        preferred_platform,
        resolve_gemini_model(
            VIDEO_CREATIVE_ANALYSIS_SPEC.default_model,
            VIDEO_CREATIVE_ANALYSIS_SPEC.model_env_var,
        ),
    )
