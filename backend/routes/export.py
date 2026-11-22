"""Routes: POST /api/export/pdf and POST /api/export/docx"""
from __future__ import annotations

from typing import Any
import re

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services.export_service import generate_pdf, generate_docx

router = APIRouter()


class ExportRequest(BaseModel):
    draft_text: str
    case_form: dict[str, Any] = {}


@router.post("/export/pdf")
async def export_pdf(body: ExportRequest) -> Response:
    if not body.draft_text.strip():
        raise HTTPException(status_code=422, detail="draft_text is required.")
    try:
        pdf_bytes = generate_pdf(body.draft_text, body.case_form)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc

    client_name = re.sub(r"[^A-Za-z0-9_-]", "_", str(body.case_form.get("client_name", "draft")).strip()) or "draft"
    filename = f"nyay_saathi_{client_name}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/export/docx")
async def export_docx(body: ExportRequest) -> Response:
    if not body.draft_text.strip():
        raise HTTPException(status_code=422, detail="draft_text is required.")
    try:
        docx_bytes = generate_docx(body.draft_text, body.case_form)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {exc}") from exc

    client_name = re.sub(r"[^A-Za-z0-9_-]", "_", str(body.case_form.get("client_name", "draft")).strip()) or "draft"
    filename = f"nyay_saathi_{client_name}.docx"
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
