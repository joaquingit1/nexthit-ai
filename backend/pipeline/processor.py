from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any

from config import ALLOW_MULTIMODAL_FALLBACK, PUBLIC_BACKEND_URL
from constants import STATUS_STEPS
from repository import repository
from system_prompts import set_db_prompts
from services.audience import aggregate_target_audience, build_audience_diagnoses
from services.change_plan import build_change_plan
from services.creative_analysis import analyze_creative_context
from services.ffmpeg import compute_duration_seconds
from services.multimodal_analysis import (
    build_multimodal_timeline,
    build_video_creative_analysis,
    delete_multimodal_video,
    prepare_gemini_video,
)
from services.persona_simulation import (
    analyze_persona_batch,
    build_persona_library_for_video,
    order_personas_for_display,
)
from services.retention import (
    build_average_line,
    build_markers,
    build_viewers_from_personas,
    find_major_drop_second,
)
from services.strategy import synthesize_final_copy, synthesize_strategic_outputs
from services.transcription import transcribe_video_with_whisper
from utils import file_type_label, format_bytes, format_duration, format_timestamp, round_value, utc_now_iso


def build_public_backend_url() -> str:
    """Build public backend URL."""
    return PUBLIC_BACKEND_URL or "http://localhost:8000"


def generate_video_title(video_summary: str, overall_label: str, original_filename: str) -> str:
    """Generate a descriptive title from the video summary."""
    # Try to extract a meaningful title from the summary
    if video_summary and len(video_summary) > 10:
        # Take the first sentence or first ~50 chars
        first_sentence = video_summary.split(".")[0].strip()
        if len(first_sentence) > 60:
            # Truncate at word boundary
            words = first_sentence[:60].rsplit(" ", 1)[0]
            return words + "..."
        if len(first_sentence) > 15:
            return first_sentence

    # Fallback to overall_label if available
    if overall_label and len(overall_label) > 5:
        return overall_label

    # Final fallback: clean the filename
    clean_name = original_filename.rsplit(".", 1)[0]  # Remove extension
    clean_name = clean_name.replace("-", " ").replace("_", " ")
    return clean_name.title()


def build_job_urls(job_id: str) -> tuple[str, str]:
    """Build job events and result URLs."""
    base = build_public_backend_url()
    return (f"{base}/api/analysis/jobs/{job_id}/events", f"{base}/api/analysis/jobs/{job_id}/result")


def build_final_analysis_payload(
    *,
    job_id: str,
    video: dict[str, Any],
    transcript: dict[str, Any],
    creative_context: dict[str, Any],
    personas: list[dict[str, Any]],
    target_audience: dict[str, Any],
    final_copy: dict[str, Any],
    video_analysis: dict[str, Any] | None,
    audience_diagnoses: list[dict[str, Any]],
    change_plan: dict[str, Any],
    media_targeting: list[dict[str, Any]],
    version_strategies: list[dict[str, Any]],
) -> dict[str, Any]:
    """Build the final analysis payload for the result."""
    duration_seconds = int(video["duration_seconds"])
    viewers = build_viewers_from_personas(personas, duration_seconds)
    average_line = build_average_line(viewers, duration_seconds)
    score_summary = {
        "id": creative_context["id"],
        "video_id": creative_context["video_id"],
        "overall_score": creative_context["overall_score"],
        "hook_score": creative_context["hook_score"],
        "clarity_score": creative_context["clarity_score"],
        "pacing_score": creative_context["pacing_score"],
        "audio_score": creative_context["audio_score"],
        "visual_score": creative_context["visual_score"],
        "novelty_score": creative_context["novelty_score"],
        "cta_score": creative_context["cta_score"],
        "platform_fit_score": creative_context["platform_fit_score"],
        "viral_score": creative_context["viral_score"],
        "conversion_score": creative_context["conversion_score"],
        "ad_readiness_score": creative_context["ad_readiness_score"],
    }
    average_watch_time = round_value(sum(persona["dropoff_second"] for persona in personas) / max(len(personas), 1), 1)
    return {
        "id": job_id,
        "status": "success",
        "video_id": video["id"],
        "job_id": job_id,
        "analysis": {
            "productName": "NextHit",
            "sessionLabel": f"Sesion {job_id.replace('job-', '').upper()}",
            "generatedAt": utc_now_iso(),
            "transcriptText": transcript["text"],
            "transcript": transcript,
            "personas": personas,
            "targetAudience": target_audience,
            "personaSegments": [],
            "segmentDiagnoses": audience_diagnoses,
            "timelineInsights": creative_context["timeline_insights"],
            "changePlan": change_plan,
            "mediaTargeting": media_targeting,
            "versionStrategies": version_strategies,
            "videoAnalysis": video_analysis,
            "scoreSummary": score_summary,
            "statusSteps": STATUS_STEPS,
            "clip": {
                "fileName": video["original_filename"],
                "generatedTitle": generate_video_title(
                    final_copy.get("video_summary", ""),
                    creative_context.get("overall_label", ""),
                    video["original_filename"],
                ),
                "mediaType": file_type_label(video.get("mime_type")),
                "sizeLabel": format_bytes(video.get("size_bytes")),
                "durationLabel": format_duration(duration_seconds),
                "label": "Clip analizado",
            },
            "summary": {
                "overallScore": creative_context["overall_score"],
                "overallLabel": creative_context["overall_label"],
                "narrative": final_copy["summary_narrative"],
                "videoSummary": final_copy["video_summary"],
                "pillars": [
                    {"label": "Potencial de retencion", "score": creative_context["viral_score"], "note": f"{average_watch_time}s de tiempo promedio esperado"},
                    {"label": "Preparacion para ads", "score": creative_context["ad_readiness_score"], "note": creative_context["primary_angle"]},
                    {"label": "Encaje multiplataforma", "score": creative_context["platform_fit_score"], "note": f"Mejor encaje actual: {creative_context['best_platform']}"},
                ],
            },
            "graph": {
                "title": "Simulacion de retencion de audiencia",
                "subtitle": "100 personas sinteticas, agrupadas en lotes emitidos en vivo, con una curva final de retencion promedio construida desde sus momentos de abandono predichos.",
                "durationSeconds": duration_seconds,
                "audienceSize": len(personas),
                "averageWatchTime": f"{average_watch_time}s",
                "mostCommonDropOff": format_timestamp(find_major_drop_second(average_line)),
                "bestFitAudience": target_audience["primaryAudience"],
                "strongestAdAngle": creative_context["primary_angle"],
                "topAudienceSegment": target_audience["primaryAudience"],
                "markers": build_markers(average_line, duration_seconds),
                "viewers": viewers,
                "averageLine": average_line,
            },
            "findings": {
                "strengths": final_copy["strengths"],
                "weaknesses": final_copy["weaknesses"],
                "metrics": [
                    {"name": "Fuerza del hook", "score": creative_context["hook_score"], "explanation": "Que tan rapido la apertura gana el siguiente segundo de atencion."},
                    {"name": "Claridad del mensaje", "score": creative_context["clarity_score"], "explanation": "Que tan claro se entiende el beneficio."},
                    {"name": "Ritmo", "score": creative_context["pacing_score"], "explanation": "Cuanto impulso sostiene la edicion despues de la apertura."},
                    {"name": "Audio / Entrega", "score": creative_context["audio_score"], "explanation": "Que tan bien la capa hablada o sonora sostiene el mensaje."},
                    {"name": "Lectura visual", "score": creative_context["visual_score"], "explanation": "Que tan facil se lee el video a velocidad de scroll."},
                    {"name": "Novedad", "score": creative_context["novelty_score"], "explanation": "Que tan distinto o sorpresivo se siente el concepto."},
                    {"name": "Fuerza de la llamada a la accion", "score": creative_context["cta_score"], "explanation": "Que tan bien convierte la atencion en accion."},
                    {"name": "Encaje de plataforma", "score": creative_context["platform_fit_score"], "explanation": f"{creative_context['best_platform']} es el encaje inicial mas fuerte para distribucion."},
                ],
            },
            "recommendations": final_copy["recommendations"],
            "adStrategy": final_copy["ad_strategy"],
            "crossPost": {"summary": final_copy["cross_post_summary"], "platforms": final_copy["platforms"]},
        },
    }


async def process_job(job_id: str, video_id: str, preferred_platform: str | None) -> None:
    """Process an analysis job."""
    # Load prompts from database at start of job
    db_prompts = await repository.get_system_prompts()
    set_db_prompts(db_prompts)

    job = await repository.get_job(job_id)
    video = await repository.get_video(video_id)
    if not job or not video:
        return

    temp_path = None
    storage_path = video.get("storage_path")
    uploaded_gemini_video: dict[str, Any] | None = None
    try:
        await repository.update_job(job_id, {"status": "processing", "stage": "upload.validated", "progress_percent": 10, "started_at": utc_now_iso()})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="upload.validated", status="processing", stage="upload.validated", progress_percent=10, payload={"video_id": video_id, "storage_path": video["storage_path"]})

        video_bytes = await repository.download_video(video["storage_path"])
        suffix = Path(video["storage_path"]).suffix or ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(video_bytes)
            temp_path = temp_file.name

        duration_seconds = compute_duration_seconds(temp_path, video.get("size_bytes"))
        await repository.update_video(video_id, {"duration_seconds": duration_seconds, "status": "uploaded"})

        transcript = await transcribe_video_with_whisper(temp_path, job.get("user_context", ""), duration_seconds)
        await repository.update_video(video_id, {"status": "transcribed", "transcript_text": transcript["text"], "transcript_language": transcript["language"], "transcript_segments": transcript["segments"], "duration_seconds": duration_seconds})
        await repository.update_job(job_id, {"stage": "transcription.completed", "progress_percent": 30})
        await repository.add_event(
            job_id=job_id,
            video_id=video_id,
            event_type="transcription.completed",
            status="processing",
            stage="transcription.completed",
            progress_percent=30,
            payload={
                "language": transcript["language"],
                "segment_count": len(transcript["segments"]),
                "duration_seconds": duration_seconds,
                "source": transcript.get("source", "unknown"),
                "error": transcript.get("error"),
            },
        )
        if transcript.get("source") != "groq":
            raise RuntimeError(
                "No se pudo obtener una transcripcion real del audio. Volve a intentar con un video que tenga voz clara."
            )

        try:
            uploaded_gemini_video = await prepare_gemini_video(temp_path, video.get("mime_type"))
            await repository.update_job(job_id, {"stage": "video.uploaded_to_gemini", "progress_percent": 35})
            await repository.add_event(
                job_id=job_id,
                video_id=video_id,
                event_type="video.uploaded_to_gemini",
                status="processing",
                stage="video.uploaded_to_gemini",
                progress_percent=35,
                payload={
                    "state": uploaded_gemini_video.get("state"),
                    "mime_type": uploaded_gemini_video.get("mime_type"),
                },
            )

            transcript = await build_multimodal_timeline(
                uploaded_file=uploaded_gemini_video,
                transcript=transcript,
                duration_seconds=duration_seconds,
            )
            await repository.update_video(
                video_id,
                {
                    "status": "multimodal_timeline_completed",
                    "transcript_segments": transcript["segments"],
                    "multimodal_timeline": transcript["segments"],
                },
            )
            await repository.update_job(job_id, {"stage": "multimodal_timeline.completed", "progress_percent": 42})
            await repository.add_event(
                job_id=job_id,
                video_id=video_id,
                event_type="multimodal_timeline.completed",
                status="processing",
                stage="multimodal_timeline.completed",
                progress_percent=42,
                payload={
                    "segment_count": len(transcript.get("segments", [])),
                    "source": transcript.get("multimodal_source", "gemini"),
                },
            )

            video_analysis = await build_video_creative_analysis(
                video_id=video_id,
                transcript=transcript,
                duration_seconds=duration_seconds,
                preferred_platform=preferred_platform,
            )
            await repository.update_video(
                video_id,
                {
                    "status": "video_analysis_completed",
                    "video_analysis": video_analysis,
                    "video_analysis_model": video_analysis.get("source_model"),
                },
            )
            await repository.update_job(job_id, {"stage": "video_analysis.completed", "progress_percent": 47})
            await repository.add_event(
                job_id=job_id,
                video_id=video_id,
                event_type="video_analysis.completed",
                status="processing",
                stage="video_analysis.completed",
                progress_percent=47,
                payload={
                    "summary": video_analysis.get("summary"),
                    "scores": video_analysis.get("scores"),
                    "source_model": video_analysis.get("source_model"),
                },
            )
        except Exception as exc:
            if not ALLOW_MULTIMODAL_FALLBACK:
                raise RuntimeError(
                    f"No se pudo completar el analisis multimodal con Gemini: {exc}"
                ) from exc
            print(f"Gemini multimodal failed, falling back to transcript-only mode: {exc}")
            video_analysis = None

        creative_context = analyze_creative_context(
            video_id,
            transcript,
            duration_seconds,
            preferred_platform,
            video_analysis,
        )
        await repository.update_job(job_id, {"stage": "creative_context.completed", "progress_percent": 50})
        await repository.add_event(
            job_id=job_id,
            video_id=video_id,
            event_type="creative_context.completed",
            status="processing",
            stage="creative_context.completed",
            progress_percent=50,
            payload={"score_summary": creative_context},
        )

        persona_library = build_persona_library_for_video(
            video_id=video_id,
            transcript_text=str(transcript.get("text", "")),
            duration_seconds=duration_seconds,
        )
        personas: list[dict[str, Any]] = []
        for batch_index in range(5):
            batch = persona_library[batch_index * 20 : (batch_index + 1) * 20]
            batch_result: list[dict[str, Any]] | None = None
            for _ in range(3):
                batch_result = await analyze_persona_batch(batch, creative_context, transcript, duration_seconds)
                if len(batch_result) == len(batch):
                    break
            if not batch_result or len(batch_result) != len(batch):
                raise RuntimeError(f"Persona batch {batch_index + 1} failed after retries.")
            for persona in batch_result:
                persona["job_id"] = job_id
                persona["video_id"] = video_id
                persona["batch_index"] = batch_index
            await repository.save_persona_batch(job_id, batch_result)
            personas.extend(batch_result)
            progress = 50 + int(((batch_index + 1) / 5) * 25)
            await repository.update_job(job_id, {"stage": "persona.batch.completed", "progress_percent": progress})
            await repository.add_event(job_id=job_id, video_id=video_id, event_type="persona.batch.completed", status="processing", stage="persona.batch.completed", progress_percent=progress, payload={"batch_index": batch_index, "batch_size": len(batch_result), "personas": batch_result})

        personas = order_personas_for_display(personas)
        target_audience = aggregate_target_audience(personas)
        await repository.update_job(job_id, {"stage": "demographics.completed", "progress_percent": 85})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="demographics.completed", status="processing", stage="demographics.completed", progress_percent=85, payload=target_audience)

        average_line = build_average_line(build_viewers_from_personas(personas, duration_seconds), duration_seconds)
        audience_diagnoses = build_audience_diagnoses(personas)
        change_plan = build_change_plan(transcript, average_line, personas, duration_seconds)
        final_copy = await synthesize_final_copy(
            creative_context,
            target_audience,
            personas,
            transcript,
            duration_seconds,
            video_analysis=video_analysis,
            precomputed_summary=(
                {
                    "video_summary": str((video_analysis or {}).get("summary", "")).strip(),
                    "summary_narrative": str((video_analysis or {}).get("narrative", "")).strip()
                    or str((video_analysis or {}).get("summary", "")).split(" Fortalezas:", 1)[0].strip(),
                }
                if video_analysis and str(video_analysis.get("summary", "")).strip()
                else None
            ),
        )
        strategic_outputs = await synthesize_strategic_outputs(
            creative_context=creative_context,
            target_audience=target_audience,
            personas=personas,
            transcript=transcript,
            duration_seconds=duration_seconds,
            average_line=average_line,
            change_plan=change_plan,
            segment_diagnoses=audience_diagnoses,
        )
        latest_video = await repository.get_video(video_id) or video
        payload = build_final_analysis_payload(
            job_id=job_id,
            video=latest_video,
            transcript=transcript,
            creative_context=creative_context,
            personas=personas,
            target_audience=target_audience,
            final_copy=final_copy,
            video_analysis=video_analysis,
            audience_diagnoses=audience_diagnoses,
            change_plan=strategic_outputs["change_plan"],
            media_targeting=strategic_outputs["media_targeting"],
            version_strategies=strategic_outputs["version_strategies"],
        )
        await repository.save_result(payload, payload["analysis"]["scoreSummary"])
        await repository.update_job(job_id, {"status": "completed", "stage": "analysis.completed", "progress_percent": 100, "completed_at": utc_now_iso()})
        await repository.update_video(video_id, {"status": "completed"})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="analysis.completed", status="completed", stage="analysis.completed", progress_percent=100, payload={"result_url": build_job_urls(job_id)[1]})
    except Exception as exc:
        await repository.update_job(job_id, {"status": "failed", "stage": "job.failed", "progress_percent": 100, "error_message": str(exc), "completed_at": utc_now_iso()})
        await repository.update_video(video_id, {"status": "failed"})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="job.failed", status="failed", stage="job.failed", progress_percent=100, payload={"error": str(exc)})
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except OSError:
                pass
        if uploaded_gemini_video:
            await delete_multimodal_video(uploaded_gemini_video)
        if storage_path:
            await repository.delete_video_object(storage_path)
