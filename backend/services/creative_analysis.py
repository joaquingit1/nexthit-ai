from __future__ import annotations

import random
from typing import Any

from utils import clamp, round_value


def default_creative_analysis(
    video_id: str,
    transcript: dict[str, Any],
    duration_seconds: int,
    preferred_platform: str | None,
) -> dict[str, Any]:
    """Generate a fallback creative analysis while preserving the expected contract."""
    text = transcript.get("text", "")
    word_boost = clamp(len(text) / 260, 0, 1) * 6
    rng = random.Random(f"{video_id}:{text[:140]}:{duration_seconds}")
    hook_score = int(clamp(72 + word_boost + rng.randint(-6, 8), 50, 96))
    clarity_score = int(clamp(73 + word_boost + rng.randint(-5, 8), 52, 96))
    pacing_score = int(clamp(70 + rng.randint(-7, 8), 48, 94))
    audio_score = int(clamp(68 + rng.randint(-7, 8), 45, 92))
    visual_score = int(clamp(80 + rng.randint(-6, 8), 56, 97))
    novelty_score = int(clamp(70 + rng.randint(-8, 9), 46, 92))
    cta_score = int(clamp(66 + rng.randint(-8, 10), 40, 90))
    platform_fit_score = int(
        clamp(
            round_value(
                hook_score * 0.22
                + clarity_score * 0.17
                + pacing_score * 0.18
                + visual_score * 0.23
                + cta_score * 0.1
                + novelty_score * 0.1
            ),
            0,
            100,
        )
    )
    viral_score = int(clamp(round_value(hook_score * 0.28 + novelty_score * 0.27 + visual_score * 0.25 + pacing_score * 0.2), 0, 100))
    conversion_score = int(clamp(round_value(cta_score * 0.42 + clarity_score * 0.26 + visual_score * 0.18 + audio_score * 0.14), 0, 100))
    ad_readiness_score = int(
        clamp(
            round_value(
                hook_score * 0.17
                + clarity_score * 0.12
                + pacing_score * 0.13
                + audio_score * 0.08
                + visual_score * 0.2
                + novelty_score * 0.08
                + cta_score * 0.1
                + platform_fit_score * 0.12,
            ),
            0,
            100,
        )
    )
    overall_score = int(
        clamp(
            round_value(
                visual_score * 0.22
                + hook_score * 0.16
                + pacing_score * 0.14
                + clarity_score * 0.14
                + platform_fit_score * 0.12
                + cta_score * 0.08
                + viral_score * 0.08
                + conversion_score * 0.06,
            ),
            0,
            100,
        )
    )
    best_platform = preferred_platform or ("TikTok" if visual_score >= 80 else "Instagram Reels")
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
        "overall_label": "Buen potencial creativo, pero el hook visual todavia puede subir.",
        "narrative": "La pieza tiene una promesa trabajable, pero necesita que lo visual aterrice el beneficio antes y con mas claridad.",
        "strongest_points": [
            "La estructura permite construir un hook visual mas fuerte sin cambiar la idea base.",
            "Hay una promesa util para social si la demostracion entra antes.",
            f"{best_platform} aparece como el mejor primer espacio para testear este corte.",
        ],
        "weaknesses": [
            "La lectura visual del beneficio puede aparecer demasiado tarde para la decision de swipe.",
            "La prueba necesita mas presencia dentro de la ventana de mayor atencion.",
            "La llamada a la accion no queda tan pegada al momento de mayor valor.",
        ],
        "timeline_insights": [
            {"id": "hook", "label": "Hook visual", "second": 1.2, "detail": "La apertura necesita dejar mas claro que se gana con seguir mirando.", "tone": "risk"},
            {"id": "energy", "label": "Caida de ritmo", "second": round_value(max(2.8, duration_seconds * 0.4), 1), "detail": "La mitad puede perder impulso si no aparece una nueva prueba.", "tone": "risk"},
            {"id": "overload", "label": "Sobrecarga", "second": round_value(max(4.2, duration_seconds * 0.68), 1), "detail": "Aca puede acumularse demasiada informacion para una lectura de scroll rapido.", "tone": "risk"},
            {"id": "loop", "label": "Potencial de loop", "second": round_value(max(1, duration_seconds - 1.6), 1), "detail": "El cierre puede aprovecharse mejor si devuelve al beneficio inicial.", "tone": "opportunity"},
        ],
        "creative_fixes": [
            "Arranca con la prueba visual o el payoff antes de la explicacion.",
            "Reduce setup y cualquier beat que no agregue claridad.",
            "Acerca el CTA al tramo con mayor prueba.",
            "Usa texto en pantalla para reforzar promesa y beneficio.",
        ],
        "best_platform": best_platform,
        "primary_angle": "Mostra el resultado antes de la explicacion.",
        "video_summary": "",
        "video_analysis": None,
    }


def analyze_creative_context(
    video_id: str,
    transcript: dict[str, Any],
    duration_seconds: int,
    preferred_platform: str | None,
    video_analysis: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Normalize multimodal Gemini output into the creative context contract used by the rest of the app."""
    fallback = default_creative_analysis(video_id, transcript, duration_seconds, preferred_platform)
    if not video_analysis:
        return fallback

    scores = video_analysis.get("scores", {})

    def score(name: str, fallback_value: int) -> int:
        return int(clamp(round(float(scores.get(name, fallback_value) or fallback_value)), 0, 100))

    normalized = {
        **fallback,
        "overall_score": score("overall_score", fallback["overall_score"]),
        "hook_score": score("hook_score", fallback["hook_score"]),
        "clarity_score": score("clarity_score", fallback["clarity_score"]),
        "pacing_score": score("pacing_score", fallback["pacing_score"]),
        "audio_score": score("audio_score", fallback["audio_score"]),
        "visual_score": score("visual_score", fallback["visual_score"]),
        "novelty_score": score("novelty_score", fallback["novelty_score"]),
        "cta_score": score("cta_score", fallback["cta_score"]),
        "platform_fit_score": score("platform_fit_score", fallback["platform_fit_score"]),
        "viral_score": score("viral_score", fallback["viral_score"]),
        "conversion_score": score("conversion_score", fallback["conversion_score"]),
        "ad_readiness_score": score("ad_readiness_score", fallback["ad_readiness_score"]),
        "overall_label": str(video_analysis.get("overall_label", fallback["overall_label"])).strip() or fallback["overall_label"],
        "narrative": str(video_analysis.get("narrative", fallback["narrative"])).strip() or fallback["narrative"],
        "strongest_points": video_analysis.get("strongest_points") or fallback["strongest_points"],
        "weaknesses": video_analysis.get("weaknesses") or fallback["weaknesses"],
        "timeline_insights": video_analysis.get("timeline_insights") or fallback["timeline_insights"],
        "creative_fixes": video_analysis.get("creative_fixes") or fallback["creative_fixes"],
        "best_platform": str(video_analysis.get("best_platform", preferred_platform or fallback["best_platform"])).strip()
        or fallback["best_platform"],
        "primary_angle": str(video_analysis.get("primary_angle", fallback["primary_angle"])).strip() or fallback["primary_angle"],
        "video_summary": str(video_analysis.get("summary", "")).strip(),
        "video_analysis": video_analysis,
    }
    return normalized
