from __future__ import annotations

import json
from typing import Any

import httpx

from config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_TEXT_MODEL, resolve_prompt_model
from utils import strip_json_wrappers


def get_json_text_from_groq(payload: dict[str, Any]) -> str:
    """Extract JSON text from Groq response payload."""
    choices = payload.get("choices", [])
    if not choices:
        raise ValueError("Groq returned no choices.")
    message = choices[0].get("message", {})
    text = message.get("content", "")
    if not text.strip():
        raise ValueError("Groq returned empty text.")
    return strip_json_wrappers(text)


async def call_groq_chat_json(
    *,
    messages: list[dict[str, Any]],
    schema_name: str,
    schema: dict[str, Any],
    strict: bool = True,
    model: str | None = None,
) -> dict[str, Any] | None:
    """Call Groq chat API with JSON schema response format."""
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


async def call_groq_text_completion(
    *,
    messages: list[dict[str, Any]],
    model: str | None = None,
    temperature: float = 0.2,
) -> str | None:
    """Call Groq chat API for text completion."""
    if not GROQ_API_KEY:
        return None

    request_payload = {
        "model": model or GROQ_TEXT_MODEL,
        "messages": messages,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=request_payload,
        )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices", [])
    if not choices:
        return None
    return str(choices[0].get("message", {}).get("content", "")).strip() or None
