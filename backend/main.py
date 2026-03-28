import asyncio
import json
import math
import mimetypes
import os
import random
import re
import subprocess
import tempfile
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "videos-raw")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
GROQ_TRANSCRIPTION_MODEL = os.getenv("GROQ_TRANSCRIPTION_MODEL", "whisper-large-v3-turbo")
GROQ_TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL", "llama-3.1-8b-instant")
PUBLIC_BACKEND_URL = os.getenv("PUBLIC_BACKEND_URL", "").rstrip("/")

app = FastAPI(title="Hackathon API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATUS_STEPS = [
    "Upload validated",
    "Transcribing with Whisper",
    "Running creative analysis",
    "Simulating 100 personas",
    "Aggregating target audience",
    "Building final growth report",
]

LOCAL_VIDEOS: dict[str, dict[str, Any]] = {}
LOCAL_JOBS: dict[str, dict[str, Any]] = {}
LOCAL_RESULTS: dict[str, dict[str, Any]] = {}
LOCAL_PERSONAS: dict[str, list[dict[str, Any]]] = defaultdict(list)
LOCAL_EVENTS: dict[str, list[dict[str, Any]]] = defaultdict(list)
LOCAL_EVENT_SEQUENCE = 0

PERSONA_NAME_SEEDS = [
    "Mia", "Jordan", "Sofia", "Liam", "Ava", "Noah", "Zoe", "Lucas", "Emma", "Leo",
    "Grace", "Mateo", "Olivia", "Ethan", "Nina", "Theo", "Isla", "Julian", "Aria", "Mason",
]
PERSONA_LAST_NAME_SEEDS = [
    "Cruz",
    "Reyes",
    "Vega",
    "Santos",
    "Navarro",
    "Costa",
    "Silva",
    "Molina",
    "Castro",
    "Prieto",
]
PERSONA_COLOR_PALETTE = ["#5eead4", "#38bdf8", "#f59e0b", "#a78bfa", "#22d3ee", "#fb7185", "#facc15", "#c084fc", "#4ade80", "#f97316"]
PERSONA_ARCHETYPES = [
    "Fast Scroller",
    "Trend Chaser",
    "Value Seeker",
    "Skeptical Buyer",
    "Niche Enthusiast",
    "Casual Entertainer",
    "Problem/Solution Shopper",
    "Creator/Marketer",
    "Impulse Buyer",
    "Story-Driven Viewer",
]
PERSONA_COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Mexico", "Brazil", "Spain", "Argentina"]
PERSONA_AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64"]
PERSONA_OCCUPATIONS = ["Junior marketer", "Growth lead", "Founder", "Fitness creator", "Media buyer", "Freelance strategist", "Community manager", "Brand designer", "Sales operator", "Student entrepreneur"]
PERSONA_INCOME_BRACKETS = ["$25k-$50k", "$50k-$90k", "$90k-$140k", "$140k-$220k"]
PERSONA_SOCIAL_STATUS = ["Student", "Young professional", "Established professional", "Business owner"]
PERSONA_INTERESTS = [
    ["short-form trends", "creator economy", "social growth"],
    ["fitness content", "habit building", "lifestyle optimization"],
    ["performance marketing", "ad testing", "measurement"],
    ["productivity", "workflow automation", "business content"],
    ["startups", "sales psychology", "brand building"],
]
PERSONA_HOBBIES = [
    ["scrolling Reels", "gym", "weekend travel"],
    ["podcasts", "running", "reading newsletters"],
    ["video editing", "photography", "gaming"],
    ["coffee chats", "tennis", "networking events"],
    ["cycling", "side projects", "content creation"],
]
PERSONA_MOTIVATIONS = [
    ["learn something useful fast", "spot winning creatives", "avoid wasting time"],
    ["find better hooks", "identify practical value", "improve campaign outcomes"],
    ["discover scroll-stopping ideas", "get inspired", "find a clear takeaway"],
]
PERSONA_FRUSTRATIONS = [
    ["slow intros", "too much setup", "generic claims"],
    ["unclear value", "weak proof", "late CTA"],
    ["messy pacing", "dense messaging", "low novelty"],
]
PERSONA_DEMOGRAPHIC_PROFILES = [
    {"id": "demo-01", "label": "Gen Z urbanos", "cluster": "Gen Z", "age_range": "18-24", "country": "United States", "income_bracket": "$25k-$50k", "social_status": "Student"},
    {"id": "demo-02", "label": "Gen Z creadores", "cluster": "Gen Z", "age_range": "18-24", "country": "Mexico", "income_bracket": "$25k-$50k", "social_status": "Young professional"},
    {"id": "demo-03", "label": "Millennials performance", "cluster": "Millennial", "age_range": "25-34", "country": "United Kingdom", "income_bracket": "$50k-$90k", "social_status": "Young professional"},
    {"id": "demo-04", "label": "Millennials founders", "cluster": "Millennial", "age_range": "25-34", "country": "Canada", "income_bracket": "$90k-$140k", "social_status": "Business owner"},
    {"id": "demo-05", "label": "Profesionales expertos", "cluster": "Profesional", "age_range": "35-44", "country": "Germany", "income_bracket": "$90k-$140k", "social_status": "Established professional"},
    {"id": "demo-06", "label": "Profesionales premium", "cluster": "Profesional", "age_range": "35-44", "country": "France", "income_bracket": "$140k-$220k", "social_status": "Established professional"},
    {"id": "demo-07", "label": "Audiencia familiar", "cluster": "Familia", "age_range": "45-54", "country": "Spain", "income_bracket": "$50k-$90k", "social_status": "Established professional"},
    {"id": "demo-08", "label": "Compradores maduros", "cluster": "Familia", "age_range": "45-54", "country": "Brazil", "income_bracket": "$90k-$140k", "social_status": "Business owner"},
    {"id": "demo-09", "label": "Senior aspiracional", "cluster": "Senior", "age_range": "55-64", "country": "Australia", "income_bracket": "$140k-$220k", "social_status": "Business owner"},
    {"id": "demo-10", "label": "Senior pragmatico", "cluster": "Senior", "age_range": "55-64", "country": "Argentina", "income_bracket": "$50k-$90k", "social_status": "Established professional"},
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


class UploadInitRequest(BaseModel):
    file_name: str
    content_type: str | None = None
    size_bytes: int | None = None


class UploadInitResponse(BaseModel):
    video_id: str
    bucket: str
    object_path: str


class CreateJobRequest(BaseModel):
    video_id: str
    storage_path: str
    user_context: str = ""
    preferred_platform: str | None = None


class JobEnvelope(BaseModel):
    job_id: str
    video_id: str
    status: str
    stage: str
    progress_percent: int
    events_url: str
    result_url: str
    error_message: str | None = None


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def round_value(value: float, digits: int = 0) -> float:
    return round(value, digits)


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def format_duration(total_seconds: int) -> str:
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def format_timestamp(total_seconds: float) -> str:
    return f"0:{int(max(total_seconds, 0)):02d}"


def format_bytes(byte_count: int | None) -> str:
    if not byte_count or byte_count <= 0:
        return "Metadata pending"
    if byte_count < 1024 * 1024:
        return f"{round_value(byte_count / 1024, 1)} KB"
    return f"{round_value(byte_count / (1024 * 1024), 1)} MB"


def file_type_label(content_type: str | None) -> str:
    if not content_type:
        return "Uploaded clip"
    if content_type.startswith("video/"):
        return "Short-form video"
    if content_type.startswith("audio/"):
        return "Audio-driven asset"
    if content_type.startswith("image/"):
        return "Visual asset"
    return "Uploaded asset"


def build_public_backend_url() -> str:
    return PUBLIC_BACKEND_URL or "http://localhost:8000"


def build_job_urls(job_id: str) -> tuple[str, str]:
    base = build_public_backend_url()
    return (f"{base}/api/analysis/jobs/{job_id}/events", f"{base}/api/analysis/jobs/{job_id}/result")


def strip_json_wrappers(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def get_json_text_from_groq(payload: dict[str, Any]) -> str:
    choices = payload.get("choices", [])
    if not choices:
        raise ValueError("Groq returned no choices.")
    message = choices[0].get("message", {})
    text = message.get("content", "")
    if not text.strip():
        raise ValueError("Groq returned empty text.")
    return strip_json_wrappers(text)


def build_transcript_segments(text: str, duration_seconds: int) -> list[dict[str, Any]]:
    normalized = re.sub(r"\s+", " ", text).strip()
    source = normalized or "We analyze the clip like a real audience would, predict retention, and turn the result into a growth strategy."
    sentences = [sentence.strip() for sentence in re.split(r"(?<=[.!?])\s+", source) if sentence.strip()] or [source]
    segment_count = max(1, min(len(sentences), 6))
    slice_duration = duration_seconds / segment_count
    return [
        {
            "start": round_value(index * slice_duration, 2),
            "end": round_value(min(duration_seconds, (index + 1) * slice_duration), 2),
            "text": sentences[index] if index < len(sentences) else sentences[-1],
        }
        for index in range(segment_count)
    ]


def normalize_transcript_segments(
    segments: list[dict[str, Any]],
    text: str,
    duration_seconds: int,
) -> list[dict[str, Any]]:
    safe_duration = max(duration_seconds, 1)
    normalized: list[dict[str, Any]] = []

    for segment in segments:
        raw_text = str(segment.get("text", "")).strip()
        if not raw_text:
            continue
        start = round_value(clamp(float(segment.get("start", 0) or 0), 0, safe_duration), 2)
        end = round_value(clamp(float(segment.get("end", start) or start), start, safe_duration), 2)
        if end <= start:
            end = round_value(min(safe_duration, start + 0.2), 2)
        normalized.append({"start": start, "end": end, "text": raw_text})

    return normalized or build_transcript_segments(text, duration_seconds)


def shutil_which(name: str) -> str | None:
    for directory in os.getenv("PATH", "").split(os.pathsep):
        candidate = Path(directory) / name
        if candidate.exists():
            return str(candidate)
        if os.name == "nt":
            exe_candidate = Path(directory) / f"{name}.exe"
            if exe_candidate.exists():
                return str(exe_candidate)
    return None


def resolve_ffmpeg_path() -> str | None:
    local_ffmpeg = shutil_which("ffmpeg")
    if local_ffmpeg:
        return local_ffmpeg

    try:
        import imageio_ffmpeg  # type: ignore

        ffmpeg_executable = imageio_ffmpeg.get_ffmpeg_exe()
        if ffmpeg_executable and Path(ffmpeg_executable).exists():
            return ffmpeg_executable
    except Exception:
        return None

    return None


def compute_duration_seconds(file_path: str, size_bytes: int | None) -> int:
    ffprobe_path = shutil_which("ffprobe")
    if ffprobe_path:
        process = subprocess.run(
            [ffprobe_path, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file_path],
            capture_output=True,
            text=True,
            check=False,
        )
        output = process.stdout.strip()
        if process.returncode == 0 and output:
            try:
                return max(1, math.ceil(float(output)))
            except ValueError:
                pass

    ffmpeg_path = resolve_ffmpeg_path()
    if ffmpeg_path:
        process = subprocess.run(
            [ffmpeg_path, "-i", file_path, "-f", "null", "-"],
            capture_output=True,
            text=True,
            check=False,
        )
        duration_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", process.stderr)
        if duration_match:
            hours = int(duration_match.group(1))
            minutes = int(duration_match.group(2))
            seconds = float(duration_match.group(3))
            total_seconds = hours * 3600 + minutes * 60 + seconds
            return max(1, math.ceil(total_seconds))

    return max(8, min(90, int((size_bytes or 9_000_000) / 650_000)))


def maybe_prepare_audio_for_transcription(source_path: str) -> tuple[str, str]:
    ffmpeg_path = resolve_ffmpeg_path()
    if not ffmpeg_path:
        raise RuntimeError("Audio extraction is required for transcription, but ffmpeg is unavailable.")

    temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
    temp_audio.close()
    process = subprocess.run(
        [
            ffmpeg_path,
            "-y",
            "-i",
            source_path,
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "48k",
            temp_audio.name,
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if process.returncode != 0 or not os.path.exists(temp_audio.name):
        try:
            os.unlink(temp_audio.name)
        except OSError:
            pass
        stderr = process.stderr.strip() or "Unknown ffmpeg error."
        raise RuntimeError(f"Audio extraction failed: {stderr}")
    return temp_audio.name, temp_audio.name


def guess_transcription_content_type(file_path: str) -> str:
    guessed_type, _ = mimetypes.guess_type(file_path)
    return guessed_type or "application/octet-stream"


class Repository:
    def __init__(self) -> None:
        self.client: Client | None = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY else None

    async def _run(self, func, *args, **kwargs):
        return await asyncio.to_thread(func, *args, **kwargs)

    @property
    def configured(self) -> bool:
        return self.client is not None

    async def create_video(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            LOCAL_VIDEOS[payload["id"]] = payload
            return payload

        def _insert():
            return self.client.table("videos").insert(payload).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def update_video(self, video_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        patch["updated_at"] = utc_now_iso()
        if not self.client:
            LOCAL_VIDEOS[video_id].update(patch)
            return LOCAL_VIDEOS[video_id]

        def _update():
            return self.client.table("videos").update(patch).eq("id", video_id).execute()

        result = await self._run(_update)
        return result.data[0]

    async def get_video(self, video_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_VIDEOS.get(video_id)

        def _select():
            return self.client.table("videos").select("*").eq("id", video_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def create_job(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            LOCAL_JOBS[payload["id"]] = payload
            return payload

        def _insert():
            return self.client.table("analysis_jobs").insert(payload).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def update_job(self, job_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        patch["updated_at"] = utc_now_iso()
        if not self.client:
            LOCAL_JOBS[job_id].update(patch)
            return LOCAL_JOBS[job_id]

        def _update():
            return self.client.table("analysis_jobs").update(patch).eq("id", job_id).execute()

        result = await self._run(_update)
        return result.data[0]

    async def get_job(self, job_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_JOBS.get(job_id)

        def _select():
            return self.client.table("analysis_jobs").select("*").eq("id", job_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def save_persona_batch(self, job_id: str, personas: list[dict[str, Any]]) -> None:
        if not personas:
            return
        if not self.client:
            LOCAL_PERSONAS[job_id].extend(personas)
            return

        rows = [
            {
                "job_id": persona["job_id"],
                "video_id": persona["video_id"],
                "persona_id": persona["persona_id"],
                "name": persona["name"],
                "age_range": persona["age_range"],
                "country": persona["country"],
                "occupation": persona["occupation"],
                "income_bracket": persona["income_bracket"],
                "social_status": persona["social_status"],
                "interests": persona["interests"],
                "hobbies": persona["hobbies"],
                "life_story": persona["life_story"],
                "platform_habits": persona["platform_habits"],
                "motivations": persona["motivations"],
                "frustrations": persona["frustrations"],
                "segment_label": persona["segment_label"],
                "color": persona["color"],
                "batch_index": persona["batch_index"],
                "dropoff_second": persona["dropoff_second"],
                "retention_percent": persona["retention_percent"],
                "why_they_left": persona["why_they_left"],
                "summary_of_interacion": persona["summary_of_interacion"],
            }
            for persona in personas
        ]

        def _insert():
            return self.client.table("persona_results").insert(rows).execute()

        await self._run(_insert)

    async def save_result(self, payload: dict[str, Any], score_summary: dict[str, Any]) -> None:
        row = {
            "job_id": payload["job_id"],
            "video_id": payload["video_id"],
            "payload": payload,
            "overall_score": score_summary["overall_score"],
            "ad_readiness_score": score_summary["ad_readiness_score"],
            "created_at": utc_now_iso(),
        }
        if not self.client:
            LOCAL_RESULTS[payload["job_id"]] = row
            return

        def _insert():
            return self.client.table("analysis_results").upsert(row).execute()

        await self._run(_insert)

    async def get_result(self, job_id: str) -> dict[str, Any] | None:
        if not self.client:
            return LOCAL_RESULTS.get(job_id)

        def _select():
            return self.client.table("analysis_results").select("*").eq("job_id", job_id).limit(1).execute()

        result = await self._run(_select)
        return result.data[0] if result.data else None

    async def add_event(
        self,
        *,
        job_id: str,
        video_id: str,
        event_type: str,
        status: str,
        stage: str,
        progress_percent: int,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        global LOCAL_EVENT_SEQUENCE
        event = {
            "job_id": job_id,
            "video_id": video_id,
            "event_type": event_type,
            "status": status,
            "stage": stage,
            "progress_percent": progress_percent,
            "payload": payload or {},
            "created_at": utc_now_iso(),
        }
        if not self.client:
            LOCAL_EVENT_SEQUENCE += 1
            event["sequence"] = LOCAL_EVENT_SEQUENCE
            LOCAL_EVENTS[job_id].append(event)
            return event

        def _insert():
            return self.client.table("analysis_events").insert(event).execute()

        result = await self._run(_insert)
        return result.data[0]

    async def get_events_after(self, job_id: str, sequence: int) -> list[dict[str, Any]]:
        if not self.client:
            return [event for event in LOCAL_EVENTS.get(job_id, []) if event["sequence"] > sequence]

        def _select():
            return (
                self.client.table("analysis_events")
                .select("*")
                .eq("job_id", job_id)
                .gt("sequence", sequence)
                .order("sequence")
                .execute()
            )

        result = await self._run(_select)
        return result.data or []

    async def download_video(self, object_path: str) -> bytes:
        if not self.client:
            raise RuntimeError("Supabase storage is required for the real upload flow.")

        def _download():
            return self.client.storage.from_(SUPABASE_BUCKET).download(object_path)

        blob = await self._run(_download)
        if isinstance(blob, bytes):
            return blob
        return bytes(blob)

    async def delete_video_object(self, object_path: str) -> None:
        if not self.client or not object_path:
            return

        def _remove():
            return self.client.storage.from_(SUPABASE_BUCKET).remove([object_path])

        try:
            await self._run(_remove)
        except Exception:
            pass


repository = Repository()


def build_persona_library() -> list[dict[str, Any]]:
    personas: list[dict[str, Any]] = []
    for archetype_index, archetype in enumerate(PERSONA_ARCHETYPES):
        for profile_index, profile in enumerate(PERSONA_DEMOGRAPHIC_PROFILES):
            index = archetype_index * len(PERSONA_DEMOGRAPHIC_PROFILES) + profile_index
            first_name = PERSONA_NAME_SEEDS[index % len(PERSONA_NAME_SEEDS)]
            last_name = PERSONA_LAST_NAME_SEEDS[(index // len(PERSONA_NAME_SEEDS)) % len(PERSONA_LAST_NAME_SEEDS)]
            personas.append(
                {
                    "persona_id": f"persona-{index + 1}",
                    "name": f"{first_name} {last_name}",
                    "archetype": archetype,
                    "demographic_profile_id": profile["id"],
                    "demographic_profile_label": profile["label"],
                    "demographic_cluster": profile["cluster"],
                    "age_range": profile["age_range"],
                    "country": profile["country"],
                    "occupation": PERSONA_OCCUPATIONS[(archetype_index + profile_index) % len(PERSONA_OCCUPATIONS)],
                    "income_bracket": profile["income_bracket"],
                    "social_status": profile["social_status"],
                    "interests": PERSONA_INTERESTS[(archetype_index + profile_index) % len(PERSONA_INTERESTS)],
                    "hobbies": PERSONA_HOBBIES[(archetype_index + profile_index) % len(PERSONA_HOBBIES)],
                    "life_story": f"{archetype}. Consume short-form y decide en segundos si el video merece atención.",
                    "platform_habits": "Principalmente consume Instagram Reels y TikTok en pausas cortas del día.",
                    "motivations": PERSONA_MOTIVATIONS[archetype_index % len(PERSONA_MOTIVATIONS)],
                    "frustrations": PERSONA_FRUSTRATIONS[profile_index % len(PERSONA_FRUSTRATIONS)],
                    "segment_label": f"{profile['cluster']} {archetype}",
                    "color": PERSONA_COLOR_PALETTE[archetype_index % len(PERSONA_COLOR_PALETTE)],
                }
            )
    return personas


PERSONA_LIBRARY = build_persona_library()


def make_fallback_transcript(duration_seconds: int, error_message: str | None = None) -> dict[str, Any]:
    text = (
        "Speech transcription was unavailable for this clip. Continue with limited transcript context "
        "until audio or multimodal extraction succeeds."
    )
    return {
        "text": text,
        "language": "unknown",
        "segments": build_transcript_segments(text, duration_seconds),
        "source": "fallback",
        "error": error_message,
    }


async def transcribe_video_with_whisper(file_path: str, user_context: str, duration_seconds: int) -> dict[str, Any]:
    if not GROQ_API_KEY:
        return make_fallback_transcript(duration_seconds, "GROQ_API_KEY is not configured.")

    transcription_path, temporary_audio_path = maybe_prepare_audio_for_transcription(file_path)
    try:
        content_type = guess_transcription_content_type(transcription_path)
        with open(transcription_path, "rb") as media_file:
            media_bytes = media_file.read()
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{GROQ_BASE_URL}/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                data={
                    "model": GROQ_TRANSCRIPTION_MODEL,
                    "response_format": "verbose_json",
                    "timestamp_granularities[]": "segment",
                },
                files={"file": (Path(transcription_path).name, media_bytes, content_type)},
            )
        response.raise_for_status()
        payload = response.json()
        transcript_text = str(payload.get("text", "")).strip()
        segments = normalize_transcript_segments(
            [
            {"start": round_value(segment.get("start", 0), 2), "end": round_value(segment.get("end", 0), 2), "text": segment.get("text", "").strip()}
            for segment in payload.get("segments", [])
            if segment.get("text")
            ],
            transcript_text,
            duration_seconds,
        )
        if not transcript_text:
            return make_fallback_transcript(duration_seconds, "Groq returned an empty transcript.")
        return {
            "text": transcript_text,
            "language": payload.get("language", "en"),
            "segments": segments,
            "source": "groq",
            "error": None,
        }
    except Exception as exc:
        print(f"Groq transcription failed for {Path(file_path).name}: {exc}")
        return make_fallback_transcript(duration_seconds, str(exc))
    finally:
        if temporary_audio_path and os.path.exists(temporary_audio_path):
            try:
                os.unlink(temporary_audio_path)
            except OSError:
                pass


async def call_groq_chat_json(
    *,
    messages: list[dict[str, Any]],
    schema_name: str,
    schema: dict[str, Any],
    strict: bool = True,
    model: str | None = None,
) -> dict[str, Any] | None:
    if not GROQ_API_KEY:
        return None

    request_payload = {
        "model": model or GROQ_TEXT_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": schema_name,
                "strict": strict,
                "schema": schema,
            },
        },
    }

    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=request_payload,
        )
    response.raise_for_status()
    return json.loads(get_json_text_from_groq(response.json()))


def creative_analysis_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "id",
            "video_id",
            "overall_score",
            "hook_score",
            "clarity_score",
            "pacing_score",
            "audio_score",
            "visual_score",
            "novelty_score",
            "cta_score",
            "platform_fit_score",
            "viral_score",
            "conversion_score",
            "ad_readiness_score",
            "overall_label",
            "narrative",
            "strongest_points",
            "weaknesses",
            "timeline_insights",
            "creative_fixes",
            "best_platform",
            "primary_angle",
        ],
        "properties": {
            "id": {"type": "string"},
            "video_id": {"type": "string"},
            "overall_score": {"type": "integer"},
            "hook_score": {"type": "integer"},
            "clarity_score": {"type": "integer"},
            "pacing_score": {"type": "integer"},
            "audio_score": {"type": "integer"},
            "visual_score": {"type": "integer"},
            "novelty_score": {"type": "integer"},
            "cta_score": {"type": "integer"},
            "platform_fit_score": {"type": "integer"},
            "viral_score": {"type": "integer"},
            "conversion_score": {"type": "integer"},
            "ad_readiness_score": {"type": "integer"},
            "overall_label": {"type": "string"},
            "narrative": {"type": "string"},
            "strongest_points": {"type": "array", "items": {"type": "string"}},
            "weaknesses": {"type": "array", "items": {"type": "string"}},
            "timeline_insights": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "label", "second", "detail", "tone"],
                    "properties": {
                        "id": {"type": "string"},
                        "label": {"type": "string"},
                        "second": {"type": "number"},
                        "detail": {"type": "string"},
                        "tone": {"type": "string", "enum": ["risk", "opportunity"]},
                    },
                },
            },
            "creative_fixes": {"type": "array", "items": {"type": "string"}},
            "best_platform": {"type": "string"},
            "primary_angle": {"type": "string"},
        },
    }


def persona_batch_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["personas"],
        "properties": {
            "personas": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "persona_id",
                        "dropoff_second",
                        "reason_code",
                        "why_they_left",
                        "summary_of_interacion",
                    ],
                    "properties": {
                        "persona_id": {"type": "string"},
                        "dropoff_second": {"type": "number"},
                        "reason_code": {"type": "string"},
                        "why_they_left": {"type": "string"},
                        "summary_of_interacion": {"type": "string"},
                    },
                },
            }
        },
    }


def final_copy_schema() -> dict[str, Any]:
    recommendation = {
        "type": "object",
        "additionalProperties": False,
        "required": ["title", "issue", "action", "example"],
        "properties": {
            "title": {"type": "string"},
            "issue": {"type": "string"},
            "action": {"type": "string"},
            "example": {"type": "string"},
        },
    }
    platform_row = {
        "type": "object",
        "additionalProperties": False,
        "required": ["platform", "fit", "tag", "verdict", "adaptations"],
        "properties": {
            "platform": {"type": "string"},
            "fit": {"type": "integer"},
            "tag": {"type": "string"},
            "verdict": {"type": "string"},
            "adaptations": {"type": "array", "items": {"type": "string"}},
        },
    }
    ad_strategy = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "campaignGoal",
            "why",
            "focus",
            "bestAudience",
            "audienceWhy",
            "messageAngle",
            "creativeVariants",
            "audienceHypotheses",
            "testingApproach",
        ],
        "properties": {
            "campaignGoal": {"type": "string"},
            "why": {"type": "string"},
            "focus": {"type": "string"},
            "bestAudience": {"type": "string"},
            "audienceWhy": {"type": "string"},
            "messageAngle": {"type": "string"},
            "creativeVariants": {"type": "array", "items": {"type": "string"}},
            "audienceHypotheses": {"type": "array", "items": {"type": "string"}},
            "testingApproach": {"type": "string"},
        },
    }
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "video_summary",
            "summary_narrative",
            "strengths",
            "weaknesses",
            "recommendations",
            "ad_strategy",
            "cross_post_summary",
            "platforms",
        ],
        "properties": {
            "video_summary": {"type": "string"},
            "summary_narrative": {"type": "string"},
            "strengths": {"type": "array", "items": {"type": "string"}},
            "weaknesses": {"type": "array", "items": {"type": "string"}},
            "recommendations": {"type": "array", "items": recommendation},
            "ad_strategy": ad_strategy,
            "cross_post_summary": {"type": "string"},
            "platforms": {"type": "array", "items": platform_row},
        },
    }


def video_summary_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["video_summary", "summary_narrative"],
        "properties": {
            "video_summary": {"type": "string"},
            "summary_narrative": {"type": "string"},
        },
    }


def summary_has_placeholder_text(text: str) -> bool:
    normalized = re.sub(r"\s+", " ", text or "").strip().lower()
    if not normalized:
        return True
    markers = [
        "speech transcription was unavailable",
        "limited transcript context",
        "demo mode is active",
        "sample keeps the full result experience",
        "fallback",
        "placeholder",
        "uploaded clip",
    ]
    if any(marker in normalized for marker in markers):
        return True
    return len(normalized.split()) < 18


def build_transcript_grounded_summary(
    transcript: dict[str, Any],
    creative_context: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str]:
    segment_text = [
        str(segment.get("text", "")).strip()
        for segment in transcript.get("segments", [])
        if str(segment.get("text", "")).strip()
    ]
    summary_core = " ".join(segment_text[:3]).strip()
    if not summary_core:
        summary_core = str(transcript.get("text", "")).strip()
    summary_core = re.sub(r"\s+", " ", summary_core).strip()
    if len(summary_core) > 520:
        summary_core = summary_core[:517].rstrip() + "..."

    strongest_points = creative_context.get("strongest_points", [])
    weaknesses = creative_context.get("weaknesses", [])
    strengths_text = "; ".join(str(point) for point in strongest_points[:2]) or "La promesa principal se entiende cuando aparece el beneficio."
    weaknesses_text = "; ".join(str(point) for point in weaknesses[:2]) or "La apertura todavia tarda en llegar al payoff."

    video_summary = (
        f"En este video de {duration_seconds}s, el mensaje se desarrolla asi: {summary_core} "
        f"Fortalezas: {strengths_text}. "
        f"Debilidades: {weaknesses_text}."
    )
    first_sentence = re.split(r"(?<=[.!?])\s+", video_summary, maxsplit=1)[0].strip()
    return {
        "video_summary": video_summary,
        "summary_narrative": first_sentence or video_summary,
    }


def strategic_outputs_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["change_plan", "media_targeting", "version_strategies"],
        "properties": {
            "change_plan": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "summary",
                    "actions",
                    "topLeaveReasons",
                    "reasonFixes",
                ],
                "properties": {
                    "summary": {"type": "string"},
                    "actions": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["title", "timestamp", "reason", "fix"],
                            "properties": {
                                "title": {"type": "string"},
                                "timestamp": {"type": ["number", "null"]},
                                "reason": {"type": "string"},
                                "fix": {"type": "string"},
                            },
                        },
                    },
                    "topLeaveReasons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["reasonCode", "reasonLabel", "count", "averageDropoffSecond", "example"],
                            "properties": {
                                "reasonCode": {"type": "string"},
                                "reasonLabel": {"type": "string"},
                                "count": {"type": "integer"},
                                "averageDropoffSecond": {"type": "number"},
                                "example": {"type": "string"},
                            },
                        },
                    },
                    "reasonFixes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["reasonCode", "reasonLabel", "action"],
                            "properties": {
                                "reasonCode": {"type": "string"},
                                "reasonLabel": {"type": "string"},
                                "action": {"type": "string"},
                            },
                        },
                    },
                },
            },
            "media_targeting": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["recommendation", "implementation"],
                    "properties": {
                        "recommendation": {"type": "string"},
                        "implementation": {"type": "string"},
                    },
                },
            },
            "version_strategies": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "name", "targetAudience", "direction", "structuralChanges", "whyItShouldResonate"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "targetAudience": {"type": "string"},
                        "direction": {"type": "string"},
                        "structuralChanges": {"type": "array", "items": {"type": "string"}},
                        "whyItShouldResonate": {"type": "string"},
                    },
                },
            },
        },
    }


def strategy_outputs_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["change_plan", "media_targeting", "version_strategies"],
        "properties": {
            "change_plan": {
                "type": "object",
                "additionalProperties": False,
                "required": ["actions", "reason_fixes"],
                "properties": {
                    "actions": {"type": "array", "items": {"type": "string"}},
                    "reason_fixes": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["reasonCode", "reasonLabel", "action"],
                            "properties": {
                                "reasonCode": {"type": "string"},
                                "reasonLabel": {"type": "string"},
                                "action": {"type": "string"},
                            },
                        },
                    },
                },
            },
            "media_targeting": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["recommendation", "implementation"],
                    "properties": {
                        "recommendation": {"type": "string"},
                        "implementation": {"type": "string"},
                    },
                },
            },
            "version_strategies": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["id", "name", "targetAudience", "direction", "structuralChanges", "whyItShouldResonate"],
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "targetAudience": {"type": "string"},
                        "direction": {"type": "string"},
                        "structuralChanges": {"type": "array", "items": {"type": "string"}},
                        "whyItShouldResonate": {"type": "string"},
                    },
                },
            },
        },
    }


def default_creative_analysis(video_id: str, transcript: dict[str, Any], duration_seconds: int, preferred_platform: str | None) -> dict[str, Any]:
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
        "overall_label": "Strong concept, faster opening needed" if hook_score < 78 else "Creative with strong paid testing potential",
        "narrative": "The value proposition is clear once it arrives, but the opening still spends too much time setting up before the strongest proof lands.",
        "strongest_points": [
            "There is a practical, marketable payoff in the core message.",
            "The middle reveals enough value to keep high-intent viewers engaged.",
            f"{best_platform} is the strongest initial distribution fit.",
        ],
        "weaknesses": [
            "The first swipe decision happens before the sharpest benefit lands.",
            "The pacing softens in the middle instead of escalating.",
            "The CTA arrives after a meaningful share of attention has already dropped.",
        ],
        "timeline_insights": [
            {"id": "hook", "label": "Hook weak", "second": 1.4, "detail": "The opening frames explain before they prove the payoff.", "tone": "risk"},
            {"id": "energy", "label": "Energy drop", "second": round_value(max(2.8, duration_seconds * 0.4), 1), "detail": "The edit becomes more descriptive than dynamic here.", "tone": "risk"},
            {"id": "overload", "label": "Cognitive overload", "second": round_value(max(4.2, duration_seconds * 0.68), 1), "detail": "The audience has to interpret too much too quickly in this stretch.", "tone": "risk"},
            {"id": "loop", "label": "Loop potential", "second": round_value(max(1, duration_seconds - 1.6), 1), "detail": "The ending could become a stronger replay trigger if it mirrors the opener.", "tone": "opportunity"},
        ],
        "creative_fixes": [
            "Start with payoff, not intro.",
            "Cut the first 1.5s.",
            "Add a pattern interrupt near the first major attention dip.",
            "Move the CTA closer to the first proof point.",
        ],
        "best_platform": best_platform,
        "primary_angle": "Lead with the result before the explanation.",
    }


async def analyze_creative_context(video_id: str, transcript: dict[str, Any], duration_seconds: int, preferred_platform: str | None) -> dict[str, Any]:
    fallback = default_creative_analysis(video_id, transcript, duration_seconds, preferred_platform)
    try:
        response = await call_groq_chat_json(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a senior short-form creative strategist. Score the creative for marketing effectiveness. "
                        "Use the transcript and duration only. timeline_insights must use ids hook, energy, overload, loop. "
                        "All scores must be integers from 0 to 100."
                    ),
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
            schema_name="creative_analysis",
            schema=creative_analysis_schema(),
        )
        if not response:
            return fallback
        merged = {**fallback, **response}
        merged["timeline_insights"] = response.get("timeline_insights") or fallback["timeline_insights"]
        return merged
    except Exception:
        return fallback


def default_persona_reason(persona: dict[str, Any], creative_context: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
    rng = random.Random(f"{persona['persona_id']}::{creative_context['overall_score']}::{creative_context['hook_score']}")
    first_hook = clamp(creative_context["hook_score"] * 0.035 + creative_context["clarity_score"] * 0.028 + creative_context["pacing_score"] * 0.025, 0.8, duration_seconds)
    archetype = persona.get("archetype", "")
    reason_code = "intro_too_slow"
    base = first_hook + rng.uniform(-0.7, 0.8)

    if archetype == "Fast Scroller":
        base -= 1.3
        reason_code = "intro_too_slow"
    elif archetype == "Trend Chaser":
        base -= 0.7
        reason_code = "low_novelty"
    elif archetype == "Value Seeker":
        base += 0.2
        reason_code = "unclear_value"
    elif archetype == "Skeptical Buyer":
        base += 0.3
        reason_code = "claim_lacks_proof"
    elif archetype == "Niche Enthusiast":
        base += 0.6
        reason_code = "irrelevant_for_audience"
    elif archetype == "Casual Entertainer":
        base -= 0.4
        reason_code = "low_energy"
    elif archetype == "Problem/Solution Shopper":
        base += 0.9
        reason_code = "unclear_value"
    elif archetype == "Creator/Marketer":
        base += 0.5
        reason_code = "weak_visual_hook"
    elif archetype == "Impulse Buyer":
        base -= 0.2
        reason_code = "cta_too_late"
    elif archetype == "Story-Driven Viewer":
        base += 0.8
        reason_code = "weak_story_payoff"

    if persona.get("age_range") == "18-24":
        base -= 0.4
    if persona.get("social_status") == "Business owner":
        base += 0.5
    if creative_context["cta_score"] < 60 and archetype in {"Impulse Buyer", "Problem/Solution Shopper"}:
        reason_code = "cta_too_late"
        base -= 0.2
    if creative_context["clarity_score"] < 68 and archetype in {"Value Seeker", "Problem/Solution Shopper"}:
        reason_code = "unclear_value"
        base -= 0.3
    if creative_context["novelty_score"] < 62 and archetype in {"Trend Chaser", "Casual Entertainer"}:
        reason_code = "low_novelty"
        base -= 0.4
    if creative_context["audio_score"] < 60:
        reason_code = "too_much_talking"

    dropoff_second = round_value(clamp(base, 0.8, duration_seconds), 1)
    retention_percent = int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100))
    reason_label = LEAVE_REASON_LABELS.get(reason_code, "Motivo no clasificado")
    left_because = f"{reason_label}. {persona['name']} siente que el video no resuelve su expectativa a tiempo."
    interaction = (
        f"{persona['name']} corta cerca de {dropoff_second}s porque identifica {reason_label.lower()}."
        if retention_percent < 85
        else f"{persona['name']} se queda hasta {dropoff_second}s; aun así detecta {reason_label.lower()} como el principal punto de fricción."
    )
    return {
        "dropoff_second": dropoff_second,
        "retention_percent": retention_percent,
        "reason_code": reason_code,
        "reason_label": reason_label,
        "why_they_left": left_because,
        "summary_of_interacion": interaction,
    }


async def analyze_persona_batch(batch: list[dict[str, Any]], creative_context: dict[str, Any], transcript: dict[str, Any], duration_seconds: int) -> list[dict[str, Any]]:
    fallback_results = [{**persona, **default_persona_reason(persona, creative_context, duration_seconds)} for persona in batch]
    try:
        response = await call_groq_chat_json(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un simulador de audiencia para videos cortos de marketing. "
                        "Piensa como cada persona individualmente y devuelve el segundo exacto en el que abandona, "
                        "el reason_code mas probable dentro de esta taxonomia exacta: "
                        f"{', '.join(LEAVE_REASON_LABELS.keys())}. "
                        "Tambien devuelve why_they_left y summary_of_interacion en espanol. "
                        "Keep dropoff_second within the duration."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "duration_seconds": duration_seconds,
                            "transcript": transcript,
                            "reason_taxonomy": LEAVE_REASON_LABELS,
                            "creative_context": {
                                "hook_score": creative_context["hook_score"],
                                "clarity_score": creative_context["clarity_score"],
                                "pacing_score": creative_context["pacing_score"],
                                "cta_score": creative_context["cta_score"],
                                "best_platform": creative_context["best_platform"],
                                "primary_angle": creative_context["primary_angle"],
                                "timeline_insights": creative_context["timeline_insights"],
                            },
                            "personas": batch,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name="persona_batch",
            schema=persona_batch_schema(),
        )
        if not response or "personas" not in response:
            return fallback_results
        mapped = {item.get("persona_id"): item for item in response.get("personas", []) if isinstance(item, dict) and item.get("persona_id")}
        normalized = []
        for persona in batch:
            base = default_persona_reason(persona, creative_context, duration_seconds)
            result = mapped.get(persona["persona_id"], {})
            dropoff_second = round_value(clamp(float(result.get("dropoff_second", base["dropoff_second"])), 0.8, duration_seconds), 1)
            normalized.append(
                {
                    **persona,
                    "dropoff_second": dropoff_second,
                    "retention_percent": int(clamp(round_value((dropoff_second / max(duration_seconds, 1)) * 100), 0, 100)),
                    "reason_code": str(result.get("reason_code", base["reason_code"])).strip(),
                    "reason_label": LEAVE_REASON_LABELS.get(str(result.get("reason_code", base["reason_code"])).strip(), base["reason_label"]),
                    "why_they_left": str(result.get("why_they_left", base["why_they_left"])).strip(),
                    "summary_of_interacion": str(result.get("summary_of_interacion", base["summary_of_interacion"])).strip(),
                }
            )
        return normalized
    except Exception:
        return fallback_results


def build_distribution_from_scalar(personas: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona[key])].append(float(persona["retention_percent"]))
    rows = [
        {
            "label": label,
            "percentage": round_value((len(retentions) / max(len(personas), 1)) * 100, 1),
            "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
        }
        for label, retentions in grouped.items()
    ]
    rows.sort(key=lambda item: (-item["percentage"], -item["averageRetention"]))
    return rows


def build_distribution_from_list(personas: list[dict[str, Any]], key: str) -> list[dict[str, Any]]:
    grouped: dict[str, list[float]] = defaultdict(list)
    for persona in personas:
        for label in persona.get(key, []):
            grouped[str(label)].append(float(persona["retention_percent"]))
    rows = [
        {
            "label": label,
            "percentage": round_value((len(retentions) / max(len(personas), 1)) * 100, 1),
            "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
        }
        for label, retentions in grouped.items()
    ]
    rows.sort(key=lambda item: (-item["averageRetention"], -item["percentage"]))
    return rows[:8]


def median(values: list[float]) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    midpoint = len(ordered) // 2
    if len(ordered) % 2 == 1:
        return float(ordered[midpoint])
    return float((ordered[midpoint - 1] + ordered[midpoint]) / 2)


def build_persona_segments(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona["segment_label"])].append(persona)

    segments = []
    for label, items in grouped.items():
        retentions = [float(item["retention_percent"]) for item in items]
        dropoffs = [float(item["dropoff_second"]) for item in items]
        reason_counts = Counter(str(item.get("reason_code", "unclear_value")) for item in items)
        dominant_reason_code = reason_counts.most_common(1)[0][0]
        sample = items[0]
        segments.append(
            {
                "label": label,
                "archetype": sample.get("archetype"),
                "demographicCluster": sample.get("demographic_cluster"),
                "support": len(items),
                "averageRetention": round_value(sum(retentions) / max(len(retentions), 1), 1),
                "medianDropoffSecond": round_value(median(dropoffs), 1),
                "dominantReasonCode": dominant_reason_code,
                "dominantReasonLabel": LEAVE_REASON_LABELS.get(dominant_reason_code, dominant_reason_code),
                "samplePersonas": [item["name"] for item in items[:2]],
            }
        )
    segments.sort(key=lambda item: (-item["averageRetention"], item["medianDropoffSecond"]))
    return segments


def build_segment_diagnoses(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    diagnoses = []
    for segment in build_persona_segments(personas):
        matching = [persona for persona in personas if persona["segment_label"] == segment["label"]]
        if not matching:
            continue
        dominant_reason_code = segment["dominantReasonCode"]
        diagnoses.append(
            {
                "label": segment["label"],
                "dropoffSecond": segment["medianDropoffSecond"],
                "reasonCode": dominant_reason_code,
                "reasonLabel": segment["dominantReasonLabel"],
                "why": Counter(persona["why_they_left"] for persona in matching).most_common(1)[0][0],
            }
        )
    diagnoses.sort(key=lambda item: item["dropoffSecond"])
    return diagnoses


def build_top_leave_reasons(personas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for persona in personas:
        grouped[str(persona.get("reason_code", "unclear_value"))].append(persona)

    rows = []
    for reason_code, items in grouped.items():
        rows.append(
            {
                "reasonCode": reason_code,
                "reasonLabel": LEAVE_REASON_LABELS.get(reason_code, reason_code),
                "count": len(items),
                "averageDropoffSecond": round_value(sum(float(item["dropoff_second"]) for item in items) / max(len(items), 1), 1),
                "example": Counter(item["why_they_left"] for item in items).most_common(1)[0][0],
            }
        )
    rows.sort(key=lambda item: (-item["count"], item["averageDropoffSecond"]))
    return rows[:3]


def detect_cta_from_transcript(transcript: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
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


def build_change_plan(transcript: dict[str, Any], average_line: list[dict[str, Any]], personas: list[dict[str, Any]], duration_seconds: int) -> dict[str, Any]:
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
                "fix": f"Mover el CTA hacia {cta_data['recommendedNewTimestamp']}s y apoyarlo con el primer proof point.",
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


def default_media_targeting(target_audience: dict[str, Any], top_reasons: list[dict[str, Any]], best_platform: str) -> list[dict[str, Any]]:
    reason_one = top_reasons[0]["reasonLabel"] if top_reasons else "intro demasiado lenta"
    reason_two = top_reasons[1]["reasonLabel"] if len(top_reasons) > 1 else "falta de prueba"
    reason_three = top_reasons[2]["reasonLabel"] if len(top_reasons) > 2 else "CTA tardío"
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    return [
        {
            "recommendation": "Prospecting frío",
            "implementation": f"Targetear {primary} con un corte hook-first en {best_platform} que ataque {reason_one.lower()} en el primer segundo.",
        },
        {
            "recommendation": "Retargeting mid-funnel",
            "implementation": f"Servir una versión proof-led a quienes vieron 50%+, corrigiendo {reason_two.lower()} con demo visible antes del segundo 4.",
        },
        {
            "recommendation": "Conversión high-intent",
            "implementation": f"Mostrar una versión más directa a {secondary}, adelantando CTA y resolviendo {reason_three.lower()} antes de la caída principal.",
        },
    ]


def default_version_strategies(target_audience: dict[str, Any], top_reasons: list[dict[str, Any]]) -> list[dict[str, Any]]:
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    return [
        {
            "id": "A",
            "name": "Version A",
            "targetAudience": primary,
            "direction": "Hook rápido para capturar atención desde el primer frame.",
            "structuralChanges": ["Abrir con outcome inmediato", "Cortar setup inicial", "Agregar patrón visual fuerte en segundo 2-3"],
            "whyItShouldResonate": "Funciona mejor para segmentos que abandonan por intro lenta o falta de novedad.",
        },
        {
            "id": "B",
            "name": "Version B",
            "targetAudience": secondary,
            "direction": "Edición centrada en prueba para compradores más escépticos.",
            "structuralChanges": ["Mostrar evidencia temprano", "Reducir claims abstractos", "Conectar CTA con la prueba principal"],
            "whyItShouldResonate": "Apunta a quienes necesitan validación concreta antes de seguir mirando.",
        },
        {
            "id": "C",
            "name": "Version C",
            "targetAudience": "Audiencias orientadas a storytelling",
            "direction": "Narrativa más aspiracional y emocional, con payoff más claro al cierre.",
            "structuralChanges": ["Reordenar el arco del relato", "Mantener tensión en mitad del video", "Cerrar con resolución memorable"],
            "whyItShouldResonate": "Busca capturar a quienes valoran contexto, construcción y cierre emocional.",
        },
    ]


def aggregate_target_audience(personas: list[dict[str, Any]]) -> dict[str, Any]:
    segments = build_persona_segments(personas)
    primary = segments[0] if segments else None
    secondary = segments[1] if len(segments) > 1 else None
    return {
        "primaryAudience": primary["label"] if primary else "Gen Z Fast Scroller",
        "secondaryAudience": secondary["label"] if secondary else "High-intent niche audience",
        "countries": build_distribution_from_scalar(personas, "country"),
        "ageRanges": build_distribution_from_scalar(personas, "age_range"),
        "interests": build_distribution_from_list(personas, "interests"),
        "hobbies": build_distribution_from_list(personas, "hobbies"),
        "socialStatus": build_distribution_from_scalar(personas, "social_status"),
        "incomeBrackets": build_distribution_from_scalar(personas, "income_bracket"),
        "personaSegments": segments,
    }


def build_viewers_from_personas(personas: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    viewers = []
    for index, persona in enumerate(personas):
        dropoff_second = clamp(float(persona["dropoff_second"]), 0.8, duration_seconds)
        viewers.append(
            {
                "id": persona["persona_id"],
                "handle": persona["name"].lower().replace(" ", "_"),
                "segment": persona["segment_label"],
                "color": persona["color"],
                "wave": index // 20,
                "points": [
                    {"second": 0, "retention": 100},
                    {"second": round_value(dropoff_second, 1), "retention": 100},
                    {"second": round_value(dropoff_second, 1), "retention": 0},
                    {"second": duration_seconds, "retention": 0},
                ],
                "dropOffSecond": round_value(dropoff_second, 1),
            }
        )
    return viewers


def build_average_line(viewers: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    sample_count = max(duration_seconds * 16, 120)
    line = []
    for index in range(sample_count + 1):
        second = round_value((index / sample_count) * duration_seconds, 2)
        active = sum(1 for viewer in viewers if viewer["dropOffSecond"] > second)
        line.append({"second": second, "retention": round_value((active / max(len(viewers), 1)) * 100, 1)})
    if line:
        line[0]["retention"] = 100
    return line


def find_major_drop_second(points: list[dict[str, Any]]) -> float:
    strongest_second = 0.0
    strongest_delta = 0.0
    for index in range(1, len(points)):
        delta = points[index - 1]["retention"] - points[index]["retention"]
        if delta > strongest_delta:
            strongest_delta = delta
            strongest_second = points[index]["second"]
    return strongest_second


def build_markers(average_line: list[dict[str, Any]], duration_seconds: int) -> list[dict[str, Any]]:
    drop_second = find_major_drop_second(average_line)
    return [
        {"second": max(1, round_value(drop_second, 1)), "retention": 62, "label": f"Major drop begins at {format_timestamp(drop_second)}", "detail": "The promise is still arriving after the most fragile swipe window."},
        {"second": round_value(min(duration_seconds - 6, max(3, duration_seconds * 0.42)), 1), "retention": 66, "label": "Mid-video proof becomes clearer", "detail": "The audience responds better when the creative stops explaining and starts proving."},
        {"second": round_value(max(1, duration_seconds - 3), 1), "retention": 32, "label": "CTA lands after attention softens", "detail": "The ask needs to appear while more of the audience is still engaged."},
    ]


def build_platform_fit_rows(best_platform: str, creative_context: dict[str, Any]) -> list[dict[str, Any]]:
    scores = {
        "TikTok": int(clamp(round_value(creative_context["hook_score"] * 0.36 + creative_context["pacing_score"] * 0.3 + creative_context["novelty_score"] * 0.34), 0, 100)),
        "Instagram Reels": int(clamp(round_value(creative_context["visual_score"] * 0.3 + creative_context["clarity_score"] * 0.22 + creative_context["hook_score"] * 0.24 + creative_context["pacing_score"] * 0.24), 0, 100)),
        "YouTube Shorts": int(clamp(round_value(creative_context["hook_score"] * 0.27 + creative_context["clarity_score"] * 0.21 + creative_context["audio_score"] * 0.22 + creative_context["pacing_score"] * 0.3), 0, 100)),
        "LinkedIn": int(clamp(round_value(creative_context["clarity_score"] * 0.32 + creative_context["audio_score"] * 0.24 + creative_context["cta_score"] * 0.16 + creative_context["platform_fit_score"] * 0.28), 0, 100)),
    }
    rows = []
    for platform, fit in scores.items():
        rows.append(
            {
                "platform": platform,
                "fit": fit,
                "tag": "Best current fit" if platform == best_platform else "Secondary fit",
                "verdict": f"{platform} fits the current structure best." if platform == best_platform else f"{platform} becomes stronger after a faster hook and cleaner payoff.",
                "adaptations": [
                    "Lead with a clearer first-frame promise.",
                    "Bring proof earlier in the edit.",
                    "Keep the CTA aligned with the opening promise.",
                ],
            }
        )
    return sorted(rows, key=lambda item: item["fit"], reverse=True)


def default_final_copy(creative_context: dict[str, Any], target_audience: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
    primary = target_audience["primaryAudience"]
    secondary = target_audience["secondaryAudience"]
    top_country = target_audience["countries"][0]["label"] if target_audience["countries"] else "United States"
    best_platform = creative_context["best_platform"]
    return {
        "video_summary": (
            f"Este video de {duration_seconds}s presenta una propuesta creativa con el foco puesto en {creative_context['primary_angle'].lower()}. "
            f"La idea principal se entiende mejor cuando aparece la prueba o el beneficio concreto, y el público que más resuena hoy es {primary}. "
            f"El principal problema es que la apertura tarda demasiado en mostrar el payoff, lo que debilita la retención inicial. "
            f"Para marketing, la oportunidad es clara: hacer más fuerte los primeros segundos, conservar el momento de mayor prueba y usar {best_platform} como primer canal de distribución."
        ),
        "summary_narrative": f"La creatividad tiene una propuesta clara, pero los primeros segundos todavía retrasan el payoff. La mayor resonancia viene de {primary}, con un segundo grupo fuerte en {secondary}, y el mejor primer canal pago es {best_platform}.",
        "strengths": creative_context["strongest_points"],
        "weaknesses": creative_context["weaknesses"],
        "recommendations": [
            {"title": "Fix the opening", "issue": "The payoff arrives after the first swipe decision window.", "action": "Open with the result, not the explanation.", "example": "Start on the clearest visual or spoken benefit in the first second."},
            {"title": "Tighten the mid-section", "issue": "Momentum softens when the edit becomes descriptive.", "action": "Add a pattern interrupt or proof beat where attention first dips.", "example": "Cut the first 1.5s and introduce a visual switch around second three."},
            {"title": "Move the CTA earlier", "issue": "The ask currently lands after attention has already weakened.", "action": "Attach the CTA to the strongest payoff moment.", "example": "Ask for the click or save immediately after the clearest proof frame."},
            {"title": "Build paid iterations around the winner", "issue": "The audience fit is strongest in a narrow cluster right now.", "action": "Launch the first paid test around the most resonant audience before widening.", "example": f"Start with {primary} in {top_country}, then branch to {secondary}."},
        ],
        "ad_strategy": {
            "campaignGoal": "Best for paid creative testing",
            "why": "The concept is strong enough to test in market, but the opening edit still holds the biggest upside.",
            "focus": "Use paid spend as a learning loop first, then scale the winner after retention proves the new hook.",
            "bestAudience": primary,
            "audienceWhy": "This cluster keeps watching longer because the value becomes practical fast enough for them to stay engaged.",
            "messageAngle": creative_context["primary_angle"],
            "creativeVariants": ["Payoff-first hook", "Problem-first hook", "Proof-first cut with earlier CTA"],
            "audienceHypotheses": [f"Primary audience in {top_country}", secondary, "Retargeting pool of viewers who watched at least 50%"],
            "testingApproach": "Launch two opening-hook variants with identical targeting, read retention first, then widen spend only on the flatter opening curve.",
        },
        "cross_post_summary": f"The transcript maps most cleanly to {best_platform}, but it can still travel to LinkedIn and Facebook with a clearer business framing.",
        "platforms": build_platform_fit_rows(best_platform, creative_context),
    }


async def synthesize_video_summary(
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    transcript: dict[str, Any],
    duration_seconds: int,
) -> dict[str, str] | None:
    if not GROQ_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=180) as client:
            response = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                json={
                    "model": GROQ_TEXT_MODEL,
                    "temperature": 0.2,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "Eres un master marketing strategist especializado en short-form video, paid social y analisis creativo. "
                                "Responde solo en espanol. "
                                "Quiero un resumen ejecutivo largo y especifico del video. "
                                "Debes describir con precision que parece decir o mostrar el video, como evoluciona el mensaje segundo a segundo, "
                                "cual es la promesa central, donde se debilita la retencion y que implicacion tiene eso para marketing. "
                                "No uses placeholders, no digas que faltan datos, no hables del sistema. Habla del video. "
                                "Cierra obligatoriamente con dos subtitulos dentro del mismo texto: 'Fortalezas:' y 'Debilidades:'. "
                                "Fortalezas debe listar lo que funciona del creativo. Debilidades debe listar lo que hoy le frena retencion o conversion. "
                                "El campo completo debe ser el texto final que vera un marketer."
                            ),
                        },
                        {
                            "role": "user",
                            "content": json.dumps(
                                {
                                    "creative_context": creative_context,
                                    "target_audience": target_audience,
                                    "transcript": transcript,
                                    "duration_seconds": duration_seconds,
                                },
                                ensure_ascii=False,
                            ),
                        },
                    ],
                },
            )
        response.raise_for_status()
        payload = response.json()
        summary_text = str(payload["choices"][0]["message"]["content"]).strip()
        if summary_has_placeholder_text(summary_text):
            return None
        first_sentence = re.split(r"(?<=[.!?])\s+", summary_text.strip(), maxsplit=1)[0].strip()
        return {
            "video_summary": summary_text,
            "summary_narrative": first_sentence or summary_text,
        }
    except Exception:
        return None


async def synthesize_final_copy(creative_context: dict[str, Any], target_audience: dict[str, Any], personas: list[dict[str, Any]], transcript: dict[str, Any], duration_seconds: int) -> dict[str, Any]:
    fallback = default_final_copy(creative_context, target_audience, duration_seconds)
    grounded_summary = build_transcript_grounded_summary(transcript, creative_context, duration_seconds)
    fallback["video_summary"] = grounded_summary["video_summary"]
    fallback["summary_narrative"] = grounded_summary["summary_narrative"]
    summary_response = await synthesize_video_summary(creative_context, target_audience, transcript, duration_seconds)
    if summary_response:
        if summary_response.get("video_summary"):
            fallback["video_summary"] = summary_response["video_summary"]
        if summary_response.get("summary_narrative"):
            fallback["summary_narrative"] = summary_response["summary_narrative"]
    try:
        response = await call_groq_chat_json(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Estás convirtiendo el análisis creativo y la simulación de audiencias en un informe de marketing pulido. "
                        "Devuelve video_summary y summary_narrative en español. "
                        "video_summary debe describir concretamente de qué trata el video, cuál es su mensaje, cómo se desarrolla y qué problema principal aparece en el comportamiento de la audiencia. "
                        "Evita frases genéricas: usa el transcript y los datos para que el resumen se sienta específico del video."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "creative_context": creative_context,
                            "target_audience": target_audience,
                            "persona_examples": personas[:10],
                            "transcript": transcript,
                            "duration_seconds": duration_seconds,
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name="final_copy",
            schema=final_copy_schema(),
        )
        if not response:
            return fallback
        merged = {**fallback, **response}
        merged["recommendations"] = response.get("recommendations") or fallback["recommendations"]
        merged["ad_strategy"] = response.get("ad_strategy") or fallback["ad_strategy"]
        merged["platforms"] = response.get("platforms") or fallback["platforms"]
        if summary_response and not summary_has_placeholder_text(summary_response.get("video_summary", "")):
            merged["video_summary"] = summary_response["video_summary"]
            merged["summary_narrative"] = summary_response["summary_narrative"]
        elif summary_has_placeholder_text(str(merged.get("video_summary", ""))):
            merged["video_summary"] = grounded_summary["video_summary"]
            merged["summary_narrative"] = grounded_summary["summary_narrative"]
        return merged
    except Exception:
        return fallback


async def synthesize_strategic_outputs(
    *,
    creative_context: dict[str, Any],
    target_audience: dict[str, Any],
    personas: list[dict[str, Any]],
    transcript: dict[str, Any],
    duration_seconds: int,
    average_line: list[dict[str, Any]],
    change_plan: dict[str, Any],
    segment_diagnoses: list[dict[str, Any]],
) -> dict[str, Any]:
    fallback = {
        "change_plan": change_plan,
        "media_targeting": default_media_targeting(
            target_audience,
            change_plan.get("topLeaveReasons", []),
            creative_context["best_platform"],
        ),
        "version_strategies": default_version_strategies(
            target_audience,
            change_plan.get("topLeaveReasons", []),
        ),
    }

    try:
        response = await call_groq_chat_json(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un director de estrategia creativa para una agencia de performance marketing. "
                        "Responde solo en espanol. "
                        "Tu trabajo es convertir transcript, curva de retencion, 100 personas sinteticas y segmentos agregados en recomendaciones muy concretas. "
                        "Debes devolver JSON valido. "
                        "En change_plan.actions, cada fix debe ser accionable y atado a tiempo real del video cuando corresponda. "
                        "En media_targeting, devuelve 3 recomendaciones del estilo 'Recommendation: Specific implementation', "
                        "pensadas como salidas de agencia para compra de medios. "
                        "En version_strategies, crea 3 caminos A/B/C realmente distintos entre si y cada uno con un target_audience claro."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "duration_seconds": duration_seconds,
                            "creative_context": creative_context,
                            "target_audience": target_audience,
                            "segment_diagnoses": segment_diagnoses,
                            "change_plan_seed": change_plan,
                            "average_line": average_line,
                            "transcript": transcript,
                            "persona_examples": personas[:20],
                        },
                        ensure_ascii=False,
                    ),
                },
            ],
            schema_name="strategic_outputs",
            schema=strategic_outputs_schema(),
        )
        if not response:
            return fallback
        return {
            "change_plan": response.get("change_plan") or fallback["change_plan"],
            "media_targeting": response.get("media_targeting") or fallback["media_targeting"],
            "version_strategies": response.get("version_strategies") or fallback["version_strategies"],
        }
    except Exception:
        return fallback


def build_final_analysis_payload(
    *,
    job_id: str,
    video: dict[str, Any],
    transcript: dict[str, Any],
    creative_context: dict[str, Any],
    personas: list[dict[str, Any]],
    target_audience: dict[str, Any],
    final_copy: dict[str, Any],
    segment_diagnoses: list[dict[str, Any]],
    change_plan: dict[str, Any],
    media_targeting: list[dict[str, Any]],
    version_strategies: list[dict[str, Any]],
) -> dict[str, Any]:
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
            "productName": "AXIOM//LENS",
            "sessionLabel": f"Session {job_id.replace('job-', '').upper()}",
            "generatedAt": utc_now_iso(),
            "transcriptText": transcript["text"],
            "transcript": transcript,
            "personas": personas,
            "targetAudience": target_audience,
            "personaSegments": target_audience.get("personaSegments", []),
            "segmentDiagnoses": segment_diagnoses,
            "timelineInsights": creative_context["timeline_insights"],
            "changePlan": change_plan,
            "mediaTargeting": media_targeting,
            "versionStrategies": version_strategies,
            "videoAnalysis": None,
            "scoreSummary": score_summary,
            "statusSteps": STATUS_STEPS,
            "clip": {"fileName": video["original_filename"], "mediaType": file_type_label(video.get("mime_type")), "sizeLabel": format_bytes(video.get("size_bytes")), "durationLabel": format_duration(duration_seconds), "label": "Analyzed clip"},
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
                "title": "Audience Retention Simulation",
                "subtitle": "100 synthetic personas, grouped into streamed batches, with a final average retention curve built from their predicted drop-off moments.",
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
                    {"name": "Hook Strength", "score": creative_context["hook_score"], "explanation": "How fast the opening earns the next second of attention."},
                    {"name": "Message Clarity", "score": creative_context["clarity_score"], "explanation": "How clearly the benefit is understood."},
                    {"name": "Pacing", "score": creative_context["pacing_score"], "explanation": "How much momentum the edit sustains after the opening."},
                    {"name": "Audio / Delivery", "score": creative_context["audio_score"], "explanation": "How well the spoken or sonic layer supports the message."},
                    {"name": "Visual Readability", "score": creative_context["visual_score"], "explanation": "How easily the video reads at scroll speed."},
                    {"name": "Novelty", "score": creative_context["novelty_score"], "explanation": "How distinct or surprising the concept feels."},
                    {"name": "CTA Strength", "score": creative_context["cta_score"], "explanation": "How effectively the video converts attention into action."},
                    {"name": "Platform Fit", "score": creative_context["platform_fit_score"], "explanation": f"{creative_context['best_platform']} is the strongest initial distribution fit."},
                ],
            },
            "recommendations": final_copy["recommendations"],
            "adStrategy": final_copy["ad_strategy"],
            "crossPost": {"summary": final_copy["cross_post_summary"], "platforms": final_copy["platforms"]},
        },
    }


async def process_job(job_id: str, video_id: str, preferred_platform: str | None) -> None:
    job = await repository.get_job(job_id)
    video = await repository.get_video(video_id)
    if not job or not video:
        return

    temp_path = None
    storage_path = video.get("storage_path")
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

        creative_context = await analyze_creative_context(video_id, transcript, duration_seconds, preferred_platform)
        await repository.update_job(job_id, {"stage": "creative_context.completed", "progress_percent": 45})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="creative_context.completed", status="processing", stage="creative_context.completed", progress_percent=45, payload={"score_summary": creative_context})

        personas: list[dict[str, Any]] = []
        for batch_index in range(5):
            batch = PERSONA_LIBRARY[batch_index * 20 : (batch_index + 1) * 20]
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

        target_audience = aggregate_target_audience(personas)
        await repository.update_job(job_id, {"stage": "demographics.completed", "progress_percent": 85})
        await repository.add_event(job_id=job_id, video_id=video_id, event_type="demographics.completed", status="processing", stage="demographics.completed", progress_percent=85, payload=target_audience)

        average_line = build_average_line(build_viewers_from_personas(personas, duration_seconds), duration_seconds)
        segment_diagnoses = build_segment_diagnoses(personas)
        change_plan = build_change_plan(transcript, average_line, personas, duration_seconds)
        final_copy = await synthesize_final_copy(creative_context, target_audience, personas, transcript, duration_seconds)
        strategic_outputs = await synthesize_strategic_outputs(
            creative_context=creative_context,
            target_audience=target_audience,
            personas=personas,
            transcript=transcript,
            duration_seconds=duration_seconds,
            average_line=average_line,
            change_plan=change_plan,
            segment_diagnoses=segment_diagnoses,
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
            segment_diagnoses=segment_diagnoses,
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
        if storage_path:
            await repository.delete_video_object(storage_path)


@app.get("/")
async def read_root():
    return {
        "status": "ok",
        "message": "Backend ready for Supabase uploads, Whisper transcription, persona streaming, and final analysis synthesis.",
        "supabase_configured": repository.configured,
        "groq_configured": bool(GROQ_API_KEY),
        "groq_transcription_model": GROQ_TRANSCRIPTION_MODEL,
        "groq_text_model": GROQ_TEXT_MODEL,
        "text_provider": "groq",
        "bucket": SUPABASE_BUCKET,
    }


@app.post("/api/uploads/init", response_model=UploadInitResponse)
async def create_upload_ticket(request: UploadInitRequest):
    if not repository.configured:
        raise HTTPException(status_code=503, detail="Supabase is not configured on the backend.")
    video_id = f"video-{uuid.uuid4().hex[:12]}"
    safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "-", request.file_name).strip("-") or "upload.mp4"
    object_path = f"{video_id}/{safe_name}"
    now = utc_now_iso()
    await repository.create_video(
        {
            "id": video_id,
            "storage_path": object_path,
            "original_filename": request.file_name,
            "mime_type": request.content_type,
            "size_bytes": request.size_bytes,
            "duration_seconds": None,
            "transcript_text": None,
            "transcript_language": None,
            "transcript_segments": None,
            "status": "pending_upload",
            "created_at": now,
            "updated_at": now,
        }
    )
    return UploadInitResponse(video_id=video_id, bucket=SUPABASE_BUCKET, object_path=object_path)


@app.post("/api/analysis/jobs", response_model=JobEnvelope)
async def create_analysis_job(request: CreateJobRequest):
    video = await repository.get_video(request.video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video was not found. Start from /api/uploads/init.")
    job_id = f"job-{uuid.uuid4().hex[:12]}"
    now = utc_now_iso()
    events_url, result_url = build_job_urls(job_id)
    job_row = await repository.create_job(
        {
            "id": job_id,
            "video_id": request.video_id,
            "status": "queued",
            "stage": "job.created",
            "progress_percent": 0,
            "error_message": None,
            "user_context": request.user_context,
            "preferred_platform": request.preferred_platform,
            "started_at": None,
            "completed_at": None,
            "created_at": now,
            "updated_at": now,
        }
    )
    await repository.update_video(request.video_id, {"storage_path": request.storage_path, "status": "queued"})
    await repository.add_event(job_id=job_id, video_id=request.video_id, event_type="job.created", status="queued", stage="job.created", progress_percent=0, payload={"events_url": events_url, "result_url": result_url})
    return JobEnvelope(job_id=job_id, video_id=request.video_id, status=job_row["status"], stage=job_row["stage"], progress_percent=job_row["progress_percent"], events_url=events_url, result_url=result_url)


@app.get("/api/analysis/jobs/{job_id}", response_model=JobEnvelope)
async def get_analysis_job(job_id: str):
    job = await repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")
    events_url, result_url = build_job_urls(job_id)
    return JobEnvelope(job_id=job["id"], video_id=job["video_id"], status=job["status"], stage=job["stage"], progress_percent=job["progress_percent"], events_url=events_url, result_url=result_url, error_message=job.get("error_message"))


@app.get("/api/analysis/jobs/{job_id}/result")
async def get_analysis_result(job_id: str):
    result = await repository.get_result(job_id)
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not ready.")
    return result["payload"]


@app.get("/api/analysis/jobs/{job_id}/events")
async def stream_analysis_events(job_id: str):
    job = await repository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")

    active_processor: asyncio.Task[Any] | None = None
    if job["status"] == "queued":
        active_processor = asyncio.create_task(
            process_job(job_id, job["video_id"], job.get("preferred_platform"))
        )

    async def event_generator():
        sequence = 0
        keepalive_started = asyncio.get_event_loop().time()
        while True:
            events = await repository.get_events_after(job_id, sequence)
            if events:
                for event in events:
                    sequence = max(sequence, int(event["sequence"]))
                    envelope = {
                        "type": event["event_type"],
                        "job_id": event["job_id"],
                        "video_id": event["video_id"],
                        "status": event.get("status"),
                        "stage": event.get("stage"),
                        "progress_percent": event.get("progress_percent"),
                        "sequence": event["sequence"],
                        "payload": event.get("payload"),
                        "timestamp": event.get("created_at"),
                    }
                    yield f"event: {event['event_type']}\ndata: {json.dumps(envelope, ensure_ascii=False)}\n\n"
                    if event["event_type"] in {"analysis.completed", "job.failed"}:
                        return
                keepalive_started = asyncio.get_event_loop().time()
            else:
                current_job = await repository.get_job(job_id)
                if current_job and current_job["status"] in {"completed", "failed"}:
                    return
                if asyncio.get_event_loop().time() - keepalive_started >= 25:
                    yield "event: keepalive\ndata: {}\n\n"
                    keepalive_started = asyncio.get_event_loop().time()
                await asyncio.sleep(0.8)

    async def wrapped_generator():
        try:
            async for chunk in event_generator():
                yield chunk
        finally:
            if active_processor and not active_processor.done():
                await active_processor

    return StreamingResponse(wrapped_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"})
