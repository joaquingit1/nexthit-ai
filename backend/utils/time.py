from __future__ import annotations

from datetime import datetime, timezone


def utc_now_iso() -> str:
    """Get current UTC time as ISO format string."""
    return datetime.now(timezone.utc).isoformat()
