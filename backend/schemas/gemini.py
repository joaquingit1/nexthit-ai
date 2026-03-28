from __future__ import annotations

from typing import Any


def multimodal_timeline_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["segments"],
        "properties": {
            "segments": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "index",
                        "start",
                        "end",
                        "visual_description",
                        "scene_labels",
                        "on_screen_text",
                        "creative_signals",
                        "retention_impact",
                        "visual_confidence",
                    ],
                    "properties": {
                        "index": {"type": "integer"},
                        "start": {"type": "number"},
                        "end": {"type": "number"},
                        "visual_description": {"type": "string"},
                        "scene_labels": {"type": "array", "items": {"type": "string"}},
                        "on_screen_text": {"type": "array", "items": {"type": "string"}},
                        "creative_signals": {"type": "array", "items": {"type": "string"}},
                        "retention_impact": {"type": "string", "enum": ["positive", "neutral", "negative"]},
                        "visual_confidence": {"type": "number"},
                    },
                },
            }
        },
    }


def video_creative_analysis_schema() -> dict[str, Any]:
    timeline_item = {
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
    }
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "summary",
            "hook",
            "visual_style",
            "pacing_notes",
            "on_screen_text_notes",
            "cta_notes",
            "overall_label",
            "narrative",
            "strongest_points",
            "weaknesses",
            "creative_fixes",
            "best_platform",
            "primary_angle",
            "timeline_insights",
            "key_moments",
            "scores",
        ],
        "properties": {
            "summary": {"type": "string"},
            "hook": {"type": "string"},
            "visual_style": {"type": "string"},
            "pacing_notes": {"type": "string"},
            "on_screen_text_notes": {"type": "string"},
            "cta_notes": {"type": "string"},
            "overall_label": {"type": "string"},
            "narrative": {"type": "string"},
            "strongest_points": {"type": "array", "items": {"type": "string"}},
            "weaknesses": {"type": "array", "items": {"type": "string"}},
            "creative_fixes": {"type": "array", "items": {"type": "string"}},
            "best_platform": {"type": "string"},
            "primary_angle": {"type": "string"},
            "timeline_insights": {"type": "array", "items": timeline_item},
            "key_moments": {"type": "array", "items": timeline_item},
            "scores": {
                "type": "object",
                "additionalProperties": False,
                "required": [
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
                ],
                "properties": {
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
                },
            },
        },
    }
