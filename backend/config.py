from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "videos-raw").strip() or "videos-raw"

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").strip().rstrip("/")
GROQ_TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL", "llama-3.1-8b-instant").strip() or "llama-3.1-8b-instant"

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "").strip().rstrip("/")
GEMINI_VIDEO_MODEL = os.getenv("GEMINI_VIDEO_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
GEMINI_TIMEOUT_SECONDS = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "180"))
ALLOW_MULTIMODAL_FALLBACK = os.getenv("ALLOW_MULTIMODAL_FALLBACK", "").strip().lower() in {
    "1",
    "true",
    "yes",
}

# Backend
PUBLIC_BACKEND_URL = os.getenv("PUBLIC_BACKEND_URL", "").strip().rstrip("/")


def resolve_prompt_model(default_model: str, model_env_var: str | None = None) -> str:
    """Resolve the model to use for a prompt, checking env var overrides."""
    if model_env_var:
        override = os.getenv(model_env_var, "").strip()
        if override:
            return override
    return os.getenv("GROQ_TEXT_MODEL", default_model).strip() or default_model


def resolve_gemini_model(default_model: str, model_env_var: str | None = None) -> str:
    """Resolve the model to use for Gemini prompts."""
    if model_env_var:
        override = os.getenv(model_env_var, "").strip()
        if override:
            return override
    return os.getenv("GEMINI_VIDEO_MODEL", default_model).strip() or default_model
