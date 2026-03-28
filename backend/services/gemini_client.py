from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from google import genai
from google.genai import types

from config import GEMINI_API_KEY, GEMINI_BASE_URL, GEMINI_TIMEOUT_SECONDS, resolve_gemini_model
from utils import strip_json_wrappers

_GEMINI_CLIENT: genai.Client | None = None


def _build_http_options(timeout_seconds: float) -> types.HttpOptions:
    options: dict[str, Any] = {
        "api_version": "v1beta",
        "timeout": int(max(timeout_seconds, 1)),
    }
    if GEMINI_BASE_URL:
        options["base_url"] = GEMINI_BASE_URL
    return types.HttpOptions(**options)


def get_gemini_client(timeout_seconds: float | None = None) -> genai.Client:
    global _GEMINI_CLIENT
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    if _GEMINI_CLIENT is None:
        _GEMINI_CLIENT = genai.Client(
            api_key=GEMINI_API_KEY,
            http_options=_build_http_options(timeout_seconds or GEMINI_TIMEOUT_SECONDS),
        )
    return _GEMINI_CLIENT


def _file_state_name(file_obj: Any) -> str:
    state = getattr(file_obj, "state", None)
    if state is None:
        return "UNKNOWN"
    name = getattr(state, "name", None)
    if name:
        return str(name).upper()
    return str(state).split(".")[-1].upper()


def normalize_uploaded_file(file_obj: Any) -> dict[str, Any]:
    return {
        "name": getattr(file_obj, "name", ""),
        "uri": getattr(file_obj, "uri", ""),
        "mime_type": getattr(file_obj, "mime_type", "") or "video/mp4",
        "display_name": getattr(file_obj, "display_name", ""),
        "state": _file_state_name(file_obj),
    }


async def upload_video_to_gemini(file_path: str, mime_type: str | None = None) -> dict[str, Any]:
    def _upload() -> dict[str, Any]:
        client = get_gemini_client()
        upload = client.files.upload(
            file=file_path,
            config=types.UploadFileConfig(
                mime_type=mime_type or "video/mp4",
                display_name=Path(file_path).name,
            ),
        )
        return normalize_uploaded_file(upload)

    return await asyncio.to_thread(_upload)


async def wait_for_gemini_file_active(
    file_name: str,
    *,
    timeout_seconds: float | None = None,
    poll_interval_seconds: float = 2.5,
) -> dict[str, Any]:
    timeout = timeout_seconds or GEMINI_TIMEOUT_SECONDS
    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout

    while loop.time() < deadline:
        def _get() -> dict[str, Any]:
            client = get_gemini_client(timeout)
            return normalize_uploaded_file(client.files.get(name=file_name))

        current = await asyncio.to_thread(_get)
        if current["state"] == "ACTIVE":
            return current
        if current["state"] in {"FAILED", "ERROR"}:
            raise RuntimeError(f"Gemini file processing failed with state {current['state']}.")
        await asyncio.sleep(poll_interval_seconds)

    raise TimeoutError("Gemini file did not reach ACTIVE state in time.")


async def delete_gemini_file(file_name: str) -> None:
    if not file_name or not GEMINI_API_KEY:
        return

    def _delete() -> None:
        client = get_gemini_client()
        client.files.delete(name=file_name)

    try:
        await asyncio.to_thread(_delete)
    except Exception:
        pass


def _extract_response_payload(response: Any) -> Any:
    parsed = getattr(response, "parsed", None)
    if parsed is not None:
        return parsed

    text = getattr(response, "text", None)
    if text:
        return json.loads(strip_json_wrappers(str(text)))

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            maybe_text = getattr(part, "text", None)
            if maybe_text:
                return json.loads(strip_json_wrappers(str(maybe_text)))
    raise ValueError("Gemini returned no parsable JSON payload.")


async def call_gemini_video_json(
    *,
    uploaded_file: dict[str, Any],
    system_prompt: str,
    prompt_payload: dict[str, Any],
    schema: dict[str, Any],
    default_model: str,
    model_env_var: str | None = None,
    temperature: float = 0.2,
    timeout_seconds: float | None = None,
) -> dict[str, Any]:
    resolved_model = resolve_gemini_model(default_model, model_env_var)
    timeout = timeout_seconds or GEMINI_TIMEOUT_SECONDS

    def _call() -> dict[str, Any]:
        client = get_gemini_client(timeout)
        response = client.models.generate_content(
            model=resolved_model,
            contents=[
                types.Part.from_uri(
                    file_uri=uploaded_file["uri"],
                    mime_type=uploaded_file.get("mime_type") or "video/mp4",
                ),
                json.dumps(prompt_payload, ensure_ascii=False),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=temperature,
                response_mime_type="application/json",
                response_json_schema=schema,
            ),
        )
        return _extract_response_payload(response)

    return await asyncio.to_thread(_call)
