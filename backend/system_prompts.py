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
        "Cada timeline_insight.detail debe tener 2-3 oraciones: que pasa en ese momento, por que afecta la retencion, y que accion concreta tomar. "
        "Se especifico basandote en el transcript, no uses frases genericas. "
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
        "Convierte transcript, curva de retencion, 100 personas sinteticas e insights agregados de audiencia en recomendaciones concretas. "
        "Devuelve JSON valido y estricto. "
        "En change_plan.actions, cada fix debe ser accionable y, cuando corresponda, estar atado a timing real del video. "
        "En media_targeting, devuelve 3 recomendaciones con formato de recomendacion e implementacion especifica, pensadas para compra de medios. "
        "En version_strategies, crea 3 caminos A/B/C realmente distintos entre si y cada uno con target_audience claro."
    ),
)


MULTIMODAL_TIMELINE_SPEC = JsonPromptSpec(
    name="multimodal_timeline",
    default_model="gemini-2.5-flash",
    model_env_var="GEMINI_VIDEO_MODEL",
    schema_name="multimodal_timeline",
    system_prompt=(
        "Eres un analista multimodal de creative intelligence para videos verticales cortos. "
        "Tu trabajo es enriquecer un transcript ya timestamped con informacion visual alineada por segmento. "
        "Recibiras un video y un transcript con segmentos existentes. No debes inventar una nueva estructura temporal: "
        "debes responder usando exactamente esos segmentos como ancla. "
        "Para cada segmento describe lo que se ve, el texto en pantalla si existe, y que senales creativas aporta para retencion y paid social. "
        "Responde solo con JSON valido, estricto y util para un pipeline posterior de personas sinteticas. "
        "Las descripciones deben ser concretas y verificables: menciona acciones, objetos, cambios visuales, overlays, captions, demos, pruebas o cortes visibles. "
        "No repitas el transcript como si fuera descripcion visual."
    ),
    temperature=0.2,
    timeout_seconds=180.0,
    strict_json_schema=False,
)


VIDEO_CREATIVE_ANALYSIS_SPEC = JsonPromptSpec(
    name="video_creative_analysis",
    default_model="gemini-2.5-flash",
    model_env_var="GEMINI_VIDEO_MODEL",
    schema_name="video_creative_analysis",
    system_prompt=(
        "Eres director de analisis creativo para short-form marketing video. "
        "Analiza el video de forma multimodal: lo que se dice, lo que se ve, el ritmo, el texto en pantalla, la claridad de la promesa, la prueba y el CTA. "
        "Responde solo en espanol y solo con JSON valido. "
        "El summary debe explicar que ocurre en el video de inicio a fin, combinando audio y visuales, sin citar grandes trozos verbatim. "
        "Los scores deben ser enteros de 0 a 100. "
        "El overall_score debe priorizar lectura visual, hook, claridad, ritmo y encaje de plataforma por encima del audio. "
        "timeline_insights debe usar exactamente los ids: hook, energy, overload, loop. "
        "Cada timeline_insight debe tener un detail de 2-3 oraciones especificas al video: "
        "explica QUE esta pasando en ese segundo exacto del video (que se ve, que se dice), "
        "POR QUE eso afecta la retencion (psicologia del viewer), "
        "y QUE accion concreta tomar para mejorarlo (ser especifico, no generico). "
        "No uses frases genericas como 'mejorar el hook' - di exactamente que cambiar basado en lo que viste en el video. "
        "No inventes campos fuera del schema."
    ),
    temperature=0.2,
    timeout_seconds=180.0,
    strict_json_schema=False,
)


VIDEO_SUMMARY_SPEC = TextPromptSpec(
    name="video_summary",
    default_model="llama-3.1-8b-instant",
    model_env_var="GROQ_VIDEO_SUMMARY_MODEL",
    system_prompt=(
        "Eres un master marketing strategist especializado en short-form video, paid social y analisis creativo. "
        "Responde solo en espanol. "
        "Tu salida final debe ser texto plano, no JSON, y debe tener exactamente esta estructura: "
        "1) un bloque inicial de 3 a 5 frases que resuma que ocurre en el video de principio a fin, "
        "en lenguaje concreto y verificable; "
        "2) una linea que empiece con 'Fortalezas:' y enumere 2 o 3 fortalezas separadas por '; '; "
        "3) una linea que empiece con 'Debilidades:' y enumere 2 o 3 debilidades separadas por '; '. "
        "No copies literalmente el transcript salvo una micro-cita de un maximo de cuatro palabras si fuera indispensable. "
        "No uses formulas vacias como 'el mensaje se desarrolla asi', 'es un video corto de', "
        "'hook, desarrollo y cierre', ni enumeres frases del transcript como si eso fuera un resumen. "
        "Debes explicar que pasa en el video: como abre, que muestra o dice en la parte media, como cierra, "
        "que promesa de valor intenta instalar y que parte concreta hace perder atencion. "
        "Si el material es confuso o caotico, dilo de forma clara y profesional en vez de repetirlo."
    ),
)


def build_persona_batch_spec(reason_codes: Iterable[str]) -> JsonPromptSpec:
    taxonomy = ", ".join(reason_codes)
    db_prompt = get_db_prompt("user_persona_batch_prompt")
    if db_prompt:
        system_prompt = (
            f"{db_prompt} "
            "Debes respetar exactamente el schema pedido por el backend, devolver evidence_excerpt especifico "
            f"y usar solo esta taxonomia de reason_codes: {taxonomy}."
        )
    else:
        system_prompt = (
            "Eres un simulador de audiencia para videos cortos de marketing. "
            "Piensa como cada persona individualmente, no como un promedio. "
            "Para cada persona, devuelve el segundo exacto en el que abandona, el reason_code mas probable dentro de esta taxonomia exacta: "
            f"{taxonomy}. "
            "Devuelve siempre, como minimo, persona_id, dropoff_second, reason_code y evidence_excerpt. "
            "Si te alcanza el espacio, tambien puedes devolver why_they_left, summary_of_interacion, liked_moment, disliked_moment, evidence_start_second, evidence_end_second y decision_stage en espanol. "
            "Cada persona debe dejar evidencia de haber evaluado una parte concreta del video: menciona un momento, una idea, una frase breve del transcript o un elemento visual verificable y conectalo con su decision. "
            "Debes respetar el pais, idioma nativo, edad, genero, hobbies y nicho de cada persona. "
            "No repitas formulas genericas como 'intro demasiado lenta' sin explicar que parte del video dispara esa conclusion. "
            "No hagas que la mayoria del batch abandone por exactamente la misma razon o cite exactamente el mismo tramo salvo que el material realmente no ofrezca otra lectura razonable. "
            "dropoff_second debe quedar siempre dentro de la duracion real del video. "
            "decision_stage debe ser uno de: hook, desarrollo, prueba, cta, cierre. "
            "No inventes campos fuera del schema y mantente consistente con el perfil de cada persona."
        )

    return JsonPromptSpec(
        name="persona_batch",
        default_model="openai/gpt-oss-20b",
        model_env_var="GROQ_PERSONA_BATCH_MODEL",
        schema_name="persona_batch",
        system_prompt=system_prompt,
    )


PROMPT_SPECS = {
    CREATIVE_ANALYSIS_SPEC.name: CREATIVE_ANALYSIS_SPEC,
    FINAL_COPY_SPEC.name: FINAL_COPY_SPEC,
    MULTIMODAL_TIMELINE_SPEC.name: MULTIMODAL_TIMELINE_SPEC,
    STRATEGIC_OUTPUTS_SPEC.name: STRATEGIC_OUTPUTS_SPEC,
    VIDEO_CREATIVE_ANALYSIS_SPEC.name: VIDEO_CREATIVE_ANALYSIS_SPEC,
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
    return build_persona_batch_spec(reason_codes)
