from __future__ import annotations


def clamp(value: float, minimum: float, maximum: float) -> float:
    """Clamp a value between minimum and maximum."""
    return max(minimum, min(maximum, value))


def round_value(value: float, digits: int = 0) -> float:
    """Round a value to a specified number of digits."""
    return round(value, digits)


def format_duration(total_seconds: int) -> str:
    """Format duration as MM:SS."""
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def format_timestamp(total_seconds: float) -> str:
    """Format timestamp as 0:SS."""
    return f"0:{int(max(total_seconds, 0)):02d}"


def format_bytes(byte_count: int | None) -> str:
    """Format byte count as human readable string."""
    if not byte_count or byte_count <= 0:
        return "Metadata pending"
    if byte_count < 1024 * 1024:
        return f"{round_value(byte_count / 1024, 1)} KB"
    return f"{round_value(byte_count / (1024 * 1024), 1)} MB"


def file_type_label(content_type: str | None) -> str:
    """Get human readable label for content type."""
    if not content_type:
        return "Clip subido"
    if content_type.startswith("video/"):
        return "Video short-form"
    if content_type.startswith("audio/"):
        return "Pieza guiada por audio"
    if content_type.startswith("image/"):
        return "Pieza visual"
    return "Pieza subida"
