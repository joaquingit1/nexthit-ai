from __future__ import annotations

STATUS_STEPS = [
    "Subida validada",
    "Transcribiendo con Whisper",
    "Corriendo análisis creativo",
    "Simulating 100 personas",
    "Agregando audiencia objetivo",
    "Armando informe final de crecimiento",
]

LEAVE_REASON_LABELS = {
    "silent_intro": "Arranque en silencio",
    "intro_too_slow": "Intro demasiado lenta",
    "unclear_value": "Valor poco claro",
    "claim_lacks_proof": "Falta prueba para creer la promesa",
    "weak_visual_hook": "Hook visual débil",
    "low_energy": "Caída de energía",
    "too_much_talking": "Demasiado texto o locución",
    "cognitive_overload": "Sobrecarga cognitiva",
    "low_novelty": "Baja novedad",
    "irrelevant_for_audience": "No se siente relevante",
    "cta_too_late": "CTA demasiado tarde",
    "weak_story_payoff": "Payoff narrativo débil",
}
