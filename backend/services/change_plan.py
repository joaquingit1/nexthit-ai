from __future__ import annotations

from typing import Any

from services.audience import build_top_leave_reasons
from services.retention import find_major_drop_second
from utils import round_value


def detect_cta_from_transcript(transcript: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
    """Detect CTA from transcript segments."""
    cta_patterns = [
        "compra", "comprá", "shop", "buy", "link", "haz clic", "click", "registrate",
        "regístrate", "suscribite", "suscríbete", "seguinos", "follow", "descargá", "descarga",
        "escribinos", "mandanos", "agenda", "reservá", "reserva",
    ]
    for segment in transcript.get("segments", []):
        text = str(segment.get("text", "")).lower()
        if any(pattern in text for pattern in cta_patterns):
            timestamp = round_value(float(segment.get("start", 0)), 1)
            return {
                "ctaPresent": True,
                "ctaTimestamp": timestamp,
                "ctaText": segment.get("text", ""),
                "recommendedNewTimestamp": round_value(min(max(timestamp - 2.5, 0.5), duration_seconds), 1),
            }
    return {
        "ctaPresent": False,
        "ctaTimestamp": None,
        "ctaText": "",
        "recommendedNewTimestamp": None,
    }


def build_change_plan(
    transcript: dict[str, Any],
    average_line: list[dict[str, Any]],
    personas: list[dict[str, Any]],
    duration_seconds: int,
) -> dict[str, Any]:
    """Build change plan based on transcript, retention curve and personas."""
    first_speech_time = round_value(float(transcript.get("segments", [{}])[0].get("start", 0) or 0), 1) if transcript.get("segments") else 0.0
    silent_intro_cut_seconds = round_value(first_speech_time, 1) if first_speech_time > 0.3 else None
    biggest_drop_second = round_value(find_major_drop_second(average_line), 1)
    cta_data = detect_cta_from_transcript(transcript, duration_seconds)
    top_reasons = build_top_leave_reasons(personas)

    actions: list[dict[str, Any]] = []
    if silent_intro_cut_seconds:
        actions.append(
            {
                "title": "Cortar intro silenciosa",
                "timestamp": silent_intro_cut_seconds,
                "reason": f"La primera voz llega en {silent_intro_cut_seconds}s y eso deja una ventana de scroll innecesaria.",
                "fix": f"Cortar los primeros {silent_intro_cut_seconds}s y abrir con voz, gesto visual o beneficio inmediato.",
            }
        )
    actions.append(
        {
            "title": "Resolver la mayor caida",
            "timestamp": biggest_drop_second,
            "reason": f"La pendiente mas fuerte de la curva aparece cerca de {biggest_drop_second}s.",
            "fix": f"Insertar prueba concreta, resultado visible o pattern interrupt exactamente en {biggest_drop_second}s.",
        }
    )
    if cta_data["ctaPresent"] and cta_data["ctaTimestamp"] and cta_data["ctaTimestamp"] > biggest_drop_second:
        actions.append(
            {
                "title": "Adelantar CTA",
                "timestamp": cta_data["ctaTimestamp"],
                "reason": f"El CTA aparece en {cta_data['ctaTimestamp']}s, despues de la mayor caida de atencion.",
                "fix": f"Mover el CTA hacia {cta_data['recommendedNewTimestamp']}s y apoyarlo con el primer punto de prueba.",
            }
        )
    elif cta_data["ctaPresent"]:
        actions.append(
            {
                "title": "Reforzar CTA actual",
                "timestamp": cta_data["ctaTimestamp"],
                "reason": "El CTA existe, pero necesita quedar mas pegado al beneficio principal.",
                "fix": "Mantenerlo en ese tramo, pero hacerlo mas concreto y unirlo a una prueba visible.",
            }
        )
    else:
        actions.append(
            {
                "title": "Agregar CTA antes de la fuga principal",
                "timestamp": biggest_drop_second,
                "reason": "No aparece un CTA claro antes del principal punto de abandono.",
                "fix": "Agregar un CTA explicito antes de la mayor caida y conectarlo al beneficio central.",
            }
        )

    reason_fixes = []
    reason_solution_map = {
        "silent_intro": "Eliminar silencios y mostrar el resultado visual desde el primer frame.",
        "intro_too_slow": "Abrir con outcome inmediato en lugar de contexto.",
        "unclear_value": "Nombrar el beneficio principal de forma mas directa y especifica.",
        "claim_lacks_proof": "Incorporar prueba visible, demo o evidencia antes de la mitad del video.",
        "weak_visual_hook": "Reforzar el primer segundo con un visual mas contundente o contraste mas claro.",
        "low_energy": "Sumar cortes, movimiento o cambio de plano en el punto de fatiga.",
        "too_much_talking": "Reducir explicacion y condensar locucion en frases mas cortas.",
        "cognitive_overload": "Separar la informacion en beats mas simples y uno por pantalla.",
        "low_novelty": "Introducir un angulo mas inesperado o diferenciador al comienzo.",
        "irrelevant_for_audience": "Alinear mejor el beneficio con el segmento mas valioso antes del segundo 3.",
        "cta_too_late": "Mover la invitacion a la accion cerca del primer momento de valor probado.",
        "weak_story_payoff": "Cerrar con un payoff mas claro que haga sentir resolucion.",
    }
    for row in top_reasons:
        reason_fixes.append(
            {
                "reasonCode": row["reasonCode"],
                "reasonLabel": row["reasonLabel"],
                "action": reason_solution_map.get(row["reasonCode"], "Reforzar claridad y ritmo en el punto de abandono."),
            }
        )

    return {
        "summary": "Plan de cambios armado con timing real del transcript, la mayor caida de retencion y los motivos de abandono mas repetidos.",
        "firstSpeechTime": first_speech_time,
        "silentIntroCutSeconds": silent_intro_cut_seconds,
        "biggestDropSecond": biggest_drop_second,
        "cta": cta_data,
        "actions": actions,
        "topLeaveReasons": top_reasons,
        "reasonFixes": reason_fixes,
    }
