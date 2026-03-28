from __future__ import annotations

import os

from dotenv import load_dotenv

load_dotenv()

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "videos-raw")

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
GROQ_TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL", "llama-3.1-8b-instant")

# Backend
PUBLIC_BACKEND_URL = os.getenv("PUBLIC_BACKEND_URL", "").rstrip("/")


def resolve_prompt_model(default_model: str, model_env_var: str | None = None) -> str:
    """Resolve the model to use for a prompt, checking env var overrides."""
    if model_env_var:
        override = os.getenv(model_env_var, "").strip()
        if override:
            return override
    return os.getenv("GROQ_TEXT_MODEL", default_model).strip() or default_model
