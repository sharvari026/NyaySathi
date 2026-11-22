"""Route: POST /api/extract"""
from __future__ import annotations

import tempfile
import os

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from services.extraction import extract_document

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/extract")
async def extract(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
) -> JSONResponse:
    # Validate MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{content_type}'. Allowed: JPEG, PNG, PDF.",
        )

    # Read and size-check
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 10 MB limit.")

    # Write to temp file (deleted after processing)
    suffix = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "application/pdf": ".pdf",
    }.get(content_type, ".bin")

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        result = await extract_document(file_bytes, doc_type, content_type)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    return JSONResponse(
        content={
            "fields": result,
            "doc_type": doc_type,
            "is_demo": result.get("is_demo", False),
        }
    )
