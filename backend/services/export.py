"""Export service for PDF generation."""
from __future__ import annotations

from typing import Any

from fpdf import FPDF


class AnalysisPDF(FPDF):
    def __init__(self) -> None:
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)

    def header(self) -> None:
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "NextHit - Reporte de Analisis", align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128)
        self.cell(0, 10, f"Pagina {self.page_no()}", align="C")

    def section_title(self, title: str) -> None:
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(30, 41, 59)
        self.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def section_subtitle(self, subtitle: str) -> None:
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(71, 85, 105)
        self.cell(0, 8, subtitle, new_x="LMARGIN", new_y="NEXT")

    def body_text(self, text: str) -> None:
        self.set_font("Helvetica", "", 10)
        self.set_text_color(51, 65, 85)
        self.multi_cell(0, 6, text)
        self.ln(2)

    def score_row(self, label: str, score: int | None) -> None:
        self.set_font("Helvetica", "", 10)
        self.set_text_color(51, 65, 85)
        score_text = str(score) if score is not None else "-"
        self.cell(100, 7, label)
        self.set_font("Helvetica", "B", 10)
        if score is not None:
            if score >= 80:
                self.set_text_color(22, 163, 74)
            elif score >= 60:
                self.set_text_color(217, 119, 6)
            else:
                self.set_text_color(220, 38, 38)
        self.cell(0, 7, score_text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(51, 65, 85)


def _safe_ascii(text: str) -> str:
    return (text or "").encode("latin-1", "replace").decode("latin-1")


def generate_pdf_from_analysis(analysis: dict[str, Any], job_id: str | None = None) -> bytes:
    pdf = AnalysisPDF()
    pdf.add_page()

    clip = analysis.get("clip", {})
    title = _safe_ascii(clip.get("fileName", "Video"))
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 15, title, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 116, 139)
    meta_line = f"Duracion: {clip.get('durationLabel', '-')} | Generado: {analysis.get('generatedAt', '-')}"
    pdf.cell(0, 6, _safe_ascii(meta_line), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)

    pdf.section_title("Puntajes")
    score_summary = analysis.get("scoreSummary", {})
    scores = [
        ("Puntaje General", score_summary.get("overall_score")),
        ("Hook", score_summary.get("hook_score")),
        ("Claridad", score_summary.get("clarity_score")),
        ("Ritmo", score_summary.get("pacing_score")),
        ("Audio", score_summary.get("audio_score")),
        ("Visual", score_summary.get("visual_score")),
        ("Novedad", score_summary.get("novelty_score")),
        ("CTA", score_summary.get("cta_score")),
        ("Encaje de Plataforma", score_summary.get("platform_fit_score")),
        ("Potencial Viral", score_summary.get("viral_score")),
        ("Conversion", score_summary.get("conversion_score")),
        ("Ad Readiness", score_summary.get("ad_readiness_score")),
    ]
    for label, score in scores:
        pdf.score_row(label, score)
    pdf.ln(5)

    summary = analysis.get("summary", {})
    if summary.get("narrative"):
        pdf.section_title("Resumen Ejecutivo")
        pdf.body_text(_safe_ascii(summary.get("narrative", "")))

    if summary.get("videoSummary"):
        pdf.section_title("Resumen del Video")
        pdf.body_text(_safe_ascii(summary.get("videoSummary", "")))

    findings = analysis.get("findings", {})
    if findings.get("strengths"):
        pdf.section_title("Fortalezas")
        for strength in findings.get("strengths", []):
            if isinstance(strength, dict):
                pdf.body_text(_safe_ascii(f"* {strength.get('text', strength.get('title', ''))}"))
            else:
                pdf.body_text(_safe_ascii(f"* {strength}"))

    if findings.get("weaknesses"):
        pdf.section_title("Debilidades")
        for weakness in findings.get("weaknesses", []):
            if isinstance(weakness, dict):
                pdf.body_text(_safe_ascii(f"* {weakness.get('text', weakness.get('title', ''))}"))
            else:
                pdf.body_text(_safe_ascii(f"* {weakness}"))

    recommendations = analysis.get("recommendations", [])
    if recommendations:
        pdf.section_title("Recomendaciones")
        for index, recommendation in enumerate(recommendations, 1):
            if isinstance(recommendation, dict):
                pdf.section_subtitle(_safe_ascii(f"{index}. {recommendation.get('title', 'Recomendacion')}"))
                if recommendation.get("issue"):
                    pdf.body_text(_safe_ascii(f"Problema: {recommendation.get('issue', '')}"))
                if recommendation.get("action"):
                    pdf.body_text(_safe_ascii(f"Accion: {recommendation.get('action', '')}"))
            else:
                pdf.body_text(_safe_ascii(f"{index}. {recommendation}"))

    savings_roi = analysis.get("savingsRoi", {})
    if savings_roi:
        pdf.add_page()
        pdf.section_title("Ahorro Estimado")
        pdf.body_text(_safe_ascii(f"Costo de re-grabar: ${savings_roi.get('estimated_reshoot_cost', 0)} USD"))
        pdf.body_text(_safe_ascii(f"Costo de edicion: ${savings_roi.get('estimated_edit_cost', 0)} USD"))
        pdf.body_text(_safe_ascii(f"Ahorro total: ${savings_roi.get('savings_amount', 0)} USD ({savings_roi.get('savings_percent', 0)}%)"))
        pdf.body_text(_safe_ascii(f"Tiempo ahorrado: {savings_roi.get('time_saved_hours', 0)} horas"))
        pdf.body_text(_safe_ascii(f"Complejidad: {savings_roi.get('complexity_level', '-')}"))
        if savings_roi.get("recommendation"):
            pdf.ln(3)
            pdf.body_text(_safe_ascii(savings_roi.get("recommendation", "")))

    return bytes(pdf.output())
