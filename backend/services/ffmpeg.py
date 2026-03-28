from __future__ import annotations

import math
import mimetypes
import os
import re
import subprocess
import tempfile
from pathlib import Path


def shutil_which(name: str) -> str | None:
    """Find executable in PATH."""
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
    """Resolve path to ffmpeg executable."""
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
    """Compute video duration in seconds using ffprobe or ffmpeg."""
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
    """Extract audio from video for transcription."""
    ffmpeg_path = resolve_ffmpeg_path()
    if not ffmpeg_path:
        raise RuntimeError("La extraccion de audio es obligatoria para la transcripcion, pero ffmpeg no esta disponible.")

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
        raise RuntimeError(f"Fallo la extraccion de audio: {stderr}")
    return temp_audio.name, temp_audio.name


def guess_transcription_content_type(file_path: str) -> str:
    """Guess MIME type for transcription file."""
    guessed_type, _ = mimetypes.guess_type(file_path)
    return guessed_type or "application/octet-stream"
