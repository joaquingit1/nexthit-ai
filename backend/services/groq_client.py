from __future__ import annotations

import json
from typing import Any

import httpx

from config import GROQ_API_KEY, GROQ_BASE_URL, GROQ_TEXT_MODEL, resolve_prompt_model
from utils import strip_json_wrappers

JSON_SCHEMA_STRICT_MODELS = {
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
}

JSON_SCHEMA_BEST_EFFORT_MODELS = {
    *JSON_SCHEMA_STRICT_MODELS,
    "openai/gpt-oss-safeguard-20b",
    "moonshotai/kimi-k2-instruct-0905",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
}


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


def model_supports_json_schema(model: str, strict: bool) -> bool:
    if strict:
        return model in JSON_SCHEMA_STRICT_MODELS
    return model in JSON_SCHEMA_BEST_EFFORT_MODELS


async def call_groq_chat_json(
    *,
    messages: list[dict[str, Any]],
    schema_name: str,
    schema: dict[str, Any],
    strict: bool = True,
    model: str | None = None,
    temperature: float = 0.2,
    timeout_seconds: float = 180,
) -> dict[str, Any] | None:
    """Call Groq chat API with JSON schema response format."""
    if not GROQ_API_KEY:
        return None

    resolved_model = model or GROQ_TEXT_MODEL
    use_json_schema = model_supports_json_schema(resolved_model, strict)
    request_messages = list(messages)
    if use_json_schema:
        response_format: dict[str, Any] = {
            "type": "json_schema",
            "json_schema": {
                "name": schema_name,
                "strict": strict,
                "schema": schema,
            },
        }
    else:
        request_messages = [
            *messages,
            {
                "role": "user",
                "content": (
                    "Devuelve solo un objeto JSON valido, sin markdown ni texto extra. "
                    f"Debe cumplir exactamente este schema JSON: {json.dumps(schema, ensure_ascii=False)}"
                ),
            },
        ]
        response_format = {"type": "json_object"}

    request_payload = {
        "model": resolved_model,
        "messages": request_messages,
        "temperature": temperature,
        "response_format": response_format,
    }

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=request_payload,
        )
    if response.status_code >= 400:
        print(
            f"Groq JSON call failed for schema={schema_name} model={resolved_model} "
            f"status={response.status_code} body={response.text[:1200]}"
        )
    response.raise_for_status()
    return json.loads(get_json_text_from_groq(response.json()))


async def call_groq_text_completion(
    *,
    messages: list[dict[str, Any]],
    model: str | None = None,
    temperature: float = 0.2,
    timeout_seconds: float = 180,
) -> str | None:
    """Call Groq chat API for text completion."""
    if not GROQ_API_KEY:
        return None

    request_payload = {
        "model": model or GROQ_TEXT_MODEL,
        "messages": messages,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
            json=request_payload,
        )
    if response.status_code >= 400:
        print(
            f"Groq text call failed for model={request_payload['model']} "
            f"status={response.status_code} body={response.text[:1200]}"
        )
    response.raise_for_status()
    payload = response.json()
    choices = payload.get("choices", [])
    if not choices:
        return None
    return str(choices[0].get("message", {}).get("content", "")).strip() or None
