"""Export routes for PDF generation."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services.export import generate_pdf_from_analysis

router = APIRouter(prefix="/api/export", tags=["export"])


class ExportPDFRequest(BaseModel):
    analysis: dict[str, Any]
    job_id: str | None = None


@router.post("/pdf")
async def export_pdf(request: ExportPDFRequest):
    try:
        pdf_bytes = generate_pdf_from_analysis(request.analysis, request.job_id)
        filename = f"analisis-{request.job_id or 'nexthit'}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {exc}") from exc
