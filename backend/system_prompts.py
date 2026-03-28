from __future__ import annotations

from dataclasses import dataclass, replace
from typing import Any, Iterable

# Cache for database prompts
_db_prompts_cache: dict[str, str | None] = {}


def set_db_prompts(prompts: dict[str, str | None]) -> None:
    """Set the database prompts cache."""
    global _db_prompts_cache
    _db_prompts_cache = prompts


def get_db_prompt(key: str) -> str | None:
    """Get a prompt from the database cache."""
    return _db_prompts_cache.get(key)


@dataclass(frozen=True)
class TranscriptionSpec:
    name: str
    default_model: str
    model_env_var: str
    response_format: str
    timeout_seconds: float


@dataclass(frozen=True)
class JsonPromptSpec:
    name: str
    default_model: str
    model_env_var: str
    schema_name: str
    system_prompt: str
    temperature: float = 0.2
    timeout_seconds: float = 180.0
    strict_json_schema: bool = True


@dataclass(frozen=True)
class TextPromptSpec:
    name: str
    default_model: str
    model_env_var: str
    system_prompt: str
    temperature: float = 0.2
    timeout_seconds: float = 180.0


TRANSCRIPTION_SPEC = TranscriptionSpec(
    name="transcription",
    default_model="whisper-large-v3-turbo",
    model_env_var="GROQ_TRANSCRIPTION_MODEL",
    response_format="verbose_json",
    timeout_seconds=180.0,
)


CREATIVE_ANALYSIS_SPEC = JsonPromptSpec(
    name="creative_analysis",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_CREATIVE_ANALYSIS_MODEL",
    schema_name="creative_analysis",
    system_prompt=(
        "Eres un estratega senior de creatividad short-form para marketing y paid social. "
        "Analiza solo transcript y duracion. "
        "Devuelve un JSON estricto con scores enteros entre 0 y 100. "
        "timeline_insights debe usar exactamente los ids: hook, energy, overload, loop. "
        "No inventes campos fuera del schema. "
        "Escribe los textos de salida en espanol claro, especifico y util para marketers."
    ),
)


FINAL_COPY_SPEC = JsonPromptSpec(
    name="final_copy",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_FINAL_COPY_MODEL",
    schema_name="final_copy",
    system_prompt=(
        "Estas convirtiendo un analisis creativo y una simulacion de audiencias en un informe de marketing pulido. "
        "Devuelve video_summary y summary_narrative en espanol. "
        "video_summary debe describir concretamente de que trata el video, cual es su mensaje, como se desarrolla y "
        "que problema principal aparece en el comportamiento de la audiencia. "
        "Evita frases genericas. Usa transcript, audiencia y contexto creativo para que el resumen se sienta especifico del video. "
        "No agregues placeholders ni hables del sistema."
    ),
)


STRATEGIC_OUTPUTS_SPEC = JsonPromptSpec(
    name="strategic_outputs",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_STRATEGIC_OUTPUTS_MODEL",
    schema_name="strategic_outputs",
    system_prompt=(
        "Eres director de estrategia creativa en una agencia de performance marketing. "
        "Responde solo en espanol. "
        "Convierte transcript, curva de retencion, 100 personas sinteticas y segmentos agregados en recomendaciones concretas. "
        "Devuelve JSON valido y estricto. "
        "En change_plan.actions, cada fix debe ser accionable y, cuando corresponda, estar atado a timing real del video. "
        "En media_targeting, devuelve 3 recomendaciones con formato de recomendacion e implementacion especifica, pensadas para compra de medios. "
        "En version_strategies, crea 3 caminos A/B/C realmente distintos entre si y cada uno con target_audience claro."
    ),
)


VIDEO_SUMMARY_SPEC = TextPromptSpec(
    name="video_summary",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_VIDEO_SUMMARY_MODEL",
    system_prompt=(
        "Eres un master marketing strategist especializado en short-form video, paid social y analisis creativo. "
        "Responde solo en espanol. "
        "Quiero un resumen ejecutivo largo y especifico del video. "
        "Debes describir con precision que parece decir o mostrar el video, como evoluciona el mensaje, "
        "cual es la promesa central, donde se debilita la retencion y que implicacion tiene eso para marketing. "
        "No uses placeholders, no digas que faltan datos y no hables del sistema. Habla del video. "
        "Cierra obligatoriamente dentro del mismo texto con los subtitulos 'Fortalezas:' y 'Debilidades:'. "
        "Fortalezas debe listar lo que funciona. Debilidades debe listar lo que hoy frena retencion o conversion. "
        "El campo completo debe ser exactamente el texto final que vera un marketer."
    ),
)


def build_persona_batch_spec(reason_codes: Iterable[str]) -> JsonPromptSpec:
    taxonomy = ", ".join(reason_codes)
    return JsonPromptSpec(
        name="persona_batch",
        default_model="llama-3.1-8b-instant",
        model_env_var="GROQ_PERSONA_BATCH_MODEL",
        schema_name="persona_batch",
        system_prompt=(
            "Eres un simulador de audiencia para videos cortos de marketing. "
            "Piensa como cada persona individualmente, no como un promedio. "
            "Para cada persona, devuelve el segundo exacto en el que abandona, el reason_code mas probable dentro de esta taxonomia exacta: "
            f"{taxonomy}. "
            "Tambien devuelve why_they_left y summary_of_interacion en espanol. "
            "dropoff_second debe quedar siempre dentro de la duracion real del video. "
            "No inventes campos fuera del schema y mantente consistente con el perfil de cada persona."
        ),
    )


PROMPT_SPECS = {
    CREATIVE_ANALYSIS_SPEC.name: CREATIVE_ANALYSIS_SPEC,
    FINAL_COPY_SPEC.name: FINAL_COPY_SPEC,
    STRATEGIC_OUTPUTS_SPEC.name: STRATEGIC_OUTPUTS_SPEC,
    VIDEO_SUMMARY_SPEC.name: VIDEO_SUMMARY_SPEC,
}

# Mapping from database column names to spec names
DB_PROMPT_MAPPING = {
    "user_persona_batch_prompt": "persona_batch",
    "score_prompt": "creative_analysis",
    "summary_video_prompt": "video_summary",
    "strategic_output_prompt": "strategic_outputs",
}


def get_creative_analysis_spec() -> JsonPromptSpec:
    """Get creative analysis spec with optional database override."""
    db_prompt = get_db_prompt("score_prompt")
    if db_prompt:
        return replace(CREATIVE_ANALYSIS_SPEC, system_prompt=db_prompt)
    return CREATIVE_ANALYSIS_SPEC


def get_strategic_outputs_spec() -> JsonPromptSpec:
    """Get strategic outputs spec with optional database override."""
    db_prompt = get_db_prompt("strategic_output_prompt")
    if db_prompt:
        return replace(STRATEGIC_OUTPUTS_SPEC, system_prompt=db_prompt)
    return STRATEGIC_OUTPUTS_SPEC


def get_video_summary_spec() -> TextPromptSpec:
    """Get video summary spec with optional database override."""
    db_prompt = get_db_prompt("summary_video_prompt")
    if db_prompt:
        return replace(VIDEO_SUMMARY_SPEC, system_prompt=db_prompt)
    return VIDEO_SUMMARY_SPEC


def build_persona_batch_spec_with_override(reason_codes: Iterable[str]) -> JsonPromptSpec:
    """Build persona batch spec with optional database override."""
    taxonomy = ", ".join(reason_codes)
    db_prompt = get_db_prompt("user_persona_batch_prompt")

    if db_prompt:
        # Append the taxonomy to the database prompt
        system_prompt = f"{db_prompt} La taxonomia de reason_codes es: {taxonomy}."
    else:
        system_prompt = (
            "Eres un simulador de audiencia para videos cortos de marketing. "
            "Piensa como cada persona individualmente, no como un promedio. "
            "Para cada persona, devuelve el segundo exacto en el que abandona, el reason_code mas probable dentro de esta taxonomia exacta: "
            f"{taxonomy}. "
            "Tambien devuelve why_they_left y summary_of_interacion en espanol. "
            "dropoff_second debe quedar siempre dentro de la duracion real del video. "
            "No inventes campos fuera del schema y mantente consistente con el perfil de cada persona."
        )

    return JsonPromptSpec(
        name="persona_batch",
        default_model="llama-3.1-8b-instant",
        model_env_var="GROQ_PERSONA_BATCH_MODEL",
        schema_name="persona_batch",
        system_prompt=system_prompt,
    )
