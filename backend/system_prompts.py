from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


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


VIDEO_SUMMARY_SPEC = JsonPromptSpec(
    name="video_summary",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_VIDEO_SUMMARY_MODEL",
    schema_name="video_summary_structured",
    system_prompt=(
        "Eres un master marketing strategist especializado en short-form video, paid social y analisis creativo. "
        "Responde solo en espanol. "
        "Debes devolver un JSON estricto con cuatro campos: de_que_trata, como_funciona_para_marketing, fortalezas y debilidades. "
        "No copies literalmente el transcript salvo una micro-cita de un maximo de seis palabras si fuera indispensable. "
        "No uses formulas vacias como 'el mensaje se desarrolla asi', no enumeres frases del transcript y no hables del sistema. "
        "Quiero una sintesis ejecutiva real: explica de que trata el video, como presenta la promesa, donde gana o pierde atencion y por que eso importa para marketing. "
        "fortalezas y debilidades deben ser arrays con puntos concretos, no abstracciones genericas."
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
            "Tambien devuelve why_they_left, summary_of_interacion, liked_moment, disliked_moment, evidence_start_second, evidence_end_second, evidence_excerpt y decision_stage en espanol. "
            "Cada persona debe dejar evidencia de haber evaluado una parte concreta del video: menciona un momento, una idea o una frase breve del transcript y conectala con su decision. "
            "No repitas formulas genericas como 'intro demasiado lenta' sin explicar que parte del video dispara esa conclusion. "
            "dropoff_second debe quedar siempre dentro de la duracion real del video. "
            "decision_stage debe ser uno de: hook, desarrollo, prueba, cta, cierre. "
            "No inventes campos fuera del schema y mantente consistente con el perfil de cada persona."
        ),
    )


PROMPT_SPECS = {
    CREATIVE_ANALYSIS_SPEC.name: CREATIVE_ANALYSIS_SPEC,
    FINAL_COPY_SPEC.name: FINAL_COPY_SPEC,
    STRATEGIC_OUTPUTS_SPEC.name: STRATEGIC_OUTPUTS_SPEC,
    VIDEO_SUMMARY_SPEC.name: VIDEO_SUMMARY_SPEC,
}
