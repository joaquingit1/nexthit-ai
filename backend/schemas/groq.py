from __future__ import annotations

from typing import Any


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
                        "evidence_excerpt",
                    ],
                    "properties": {
                        "persona_id": {"type": "string"},
                        "dropoff_second": {"type": "number"},
                        "reason_code": {"type": "string"},
                        "why_they_left": {"type": "string"},
                        "summary_of_interacion": {"type": "string"},
                        "liked_moment": {"type": "string"},
                        "disliked_moment": {"type": "string"},
                        "evidence_start_second": {"type": "number"},
                        "evidence_end_second": {"type": "number"},
                        "evidence_excerpt": {"type": "string"},
                        "decision_stage": {
                            "type": "string",
                            "enum": ["hook", "desarrollo", "prueba", "cta", "cierre"],
                        },
                    },
                },
            }
        },
    }


def persona_batch_compact_schema() -> dict[str, Any]:
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
                        "evidence_excerpt",
                    ],
                    "properties": {
                        "persona_id": {"type": "string"},
                        "dropoff_second": {"type": "number"},
                        "reason_code": {"type": "string"},
                        "evidence_excerpt": {"type": "string"},
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
        "required": ["de_que_trata", "como_funciona_para_marketing", "fortalezas", "debilidades"],
        "properties": {
            "de_que_trata": {"type": "string"},
            "como_funciona_para_marketing": {"type": "string"},
            "fortalezas": {"type": "array", "items": {"type": "string"}},
            "debilidades": {"type": "array", "items": {"type": "string"}},
        },
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
