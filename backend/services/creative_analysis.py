from __future__ import annotations

import json
import random
from typing import Any

from config import resolve_prompt_model
from schemas import creative_analysis_schema
from services.groq_client import call_groq_chat_json
from system_prompts import CREATIVE_ANALYSIS_SPEC
from utils import clamp, round_value


def default_creative_analysis(
    video_id: str,
    transcript: dict[str, Any],
    duration_seconds: int,
    preferred_platform: str | None,
) -> dict[str, Any]:
    """Generate default creative analysis scores."""
    text = transcript["text"]
    word_boost = clamp(len(text) / 260, 0, 1) * 7
    rng = random.Random(f"{video_id}:{text[:140]}")
    hook_score = int(clamp(70 + word_boost + rng.randint(-6, 12), 52, 95))
    clarity_score = int(clamp(73 + word_boost + rng.randint(-5, 11), 55, 96))
    pacing_score = int(clamp(68 + rng.randint(-8, 12), 48, 92))
    audio_score = int(clamp(72 + rng.randint(-5, 10), 54, 93))
    visual_score = int(clamp(74 + rng.randint(-5, 13), 55, 96))
    novelty_score = int(clamp(66 + rng.randint(-8, 14), 44, 90))
    cta_score = int(clamp(63 + rng.randint(-9, 16), 40, 89))
    platform_fit_score = int(clamp(round_value(hook_score * 0.28 + clarity_score * 0.22 + pacing_score * 0.25 + visual_score * 0.25), 0, 100))
    viral_score = int(clamp(round_value(hook_score * 0.4 + novelty_score * 0.35 + pacing_score * 0.25), 0, 100))
    conversion_score = int(clamp(round_value(cta_score * 0.55 + clarity_score * 0.45), 0, 100))
    ad_readiness_score = int(clamp(round_value(hook_score * 0.21 + clarity_score * 0.14 + pacing_score * 0.15 + audio_score * 0.1 + visual_score * 0.12 + novelty_score * 0.08 + cta_score * 0.1 + platform_fit_score * 0.1), 0, 100))
    overall_score = int(clamp(round_value((hook_score + clarity_score + pacing_score + visual_score + platform_fit_score + ad_readiness_score) / 6), 0, 100))
    best_platform = preferred_platform or ("Instagram Reels" if platform_fit_score >= 78 else "TikTok")
    return {
        "id": f"creative-{video_id}",
        "video_id": video_id,
        "overall_score": overall_score,
        "hook_score": hook_score,
        "clarity_score": clarity_score,
        "pacing_score": pacing_score,
        "audio_score": audio_score,
        "visual_score": visual_score,
        "novelty_score": novelty_score,
        "cta_score": cta_score,
        "platform_fit_score": platform_fit_score,
        "viral_score": viral_score,
        "conversion_score": conversion_score,
        "ad_readiness_score": ad_readiness_score,
        "overall_label": "Buen concepto, pero necesita una apertura más rápida" if hook_score < 78 else "Creativo con mucho potencial para testing pago",
        "narrative": "La propuesta de valor se entiende cuando finalmente aparece, pero la apertura todavía gasta demasiado tiempo preparando antes de mostrar la prueba más fuerte.",
        "strongest_points": [
            "Hay un beneficio práctico y vendible en el mensaje central.",
            "La mitad del video revela suficiente valor como para sostener a quienes ya vienen con intención alta.",
            f"{best_platform} es el mejor encaje inicial de distribución.",
        ],
        "weaknesses": [
            "La primera decisión de seguir o abandonar ocurre antes de que aparezca el beneficio más fuerte.",
            "El ritmo pierde fuerza en la mitad en vez de escalar.",
            "La llamada a la acción llega cuando una parte importante de la atención ya cayó.",
        ],
        "timeline_insights": [
            {"id": "hook", "label": "Hook débil", "second": 1.4, "detail": "Los primeros frames explican antes de demostrar el resultado.", "tone": "risk"},
            {"id": "energy", "label": "Caída de energía", "second": round_value(max(2.8, duration_seconds * 0.4), 1), "detail": "Acá la edición se vuelve más descriptiva que dinámica.", "tone": "risk"},
            {"id": "overload", "label": "Sobrecarga cognitiva", "second": round_value(max(4.2, duration_seconds * 0.68), 1), "detail": "En este tramo la audiencia tiene que procesar demasiado en muy poco tiempo.", "tone": "risk"},
            {"id": "loop", "label": "Potencial de loop", "second": round_value(max(1, duration_seconds - 1.6), 1), "detail": "El cierre podría disparar más replays si espeja la apertura.", "tone": "opportunity"},
        ],
        "creative_fixes": [
            "Empezá con el resultado, no con la introducción.",
            "Recortá los primeros 1.5s.",
            "Sumá un pattern interrupt cerca de la primera gran caída de atención.",
            "Mové la llamada a la acción más cerca del primer punto de prueba.",
        ],
        "best_platform": best_platform,
        "primary_angle": "Empezá con el resultado antes de la explicación.",
    }


async def analyze_creative_context(
    video_id: str,
    transcript: dict[str, Any],
    duration_seconds: int,
    preferred_platform: str | None,
) -> dict[str, Any]:
    """Analyze creative context using Groq LLM."""
    fallback = default_creative_analysis(video_id, transcript, duration_seconds, preferred_platform)
    try:
        spec = CREATIVE_ANALYSIS_SPEC
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
                            "video_id": video_id,
                            "duration_seconds": duration_seconds,
                            "transcript": transcript,
                            "preferred_platform": preferred_platform,
                            "future_video_analysis": None,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name=spec.schema_name,
            schema=creative_analysis_schema(),
            model=resolve_prompt_model(spec.default_model, spec.model_env_var),
            temperature=spec.temperature,
            timeout_seconds=spec.timeout_seconds,
        )
        if not response:
            return fallback
        merged = {**fallback, **response}
        merged["timeline_insights"] = response.get("timeline_insights") or fallback["timeline_insights"]
        return merged
    except Exception as exc:
        print(f"Creative analysis failed: {exc}")
        return fallback
