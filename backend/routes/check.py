"""Route: POST /api/check"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Any

from services.checker import check_documents

router = APIRouter()


class CheckRequest(BaseModel):
    extracted_docs: list[dict[str, Any]]
    case_form: dict[str, Any]


@router.post("/check")
async def check(body: CheckRequest) -> JSONResponse:
    if not isinstance(body.extracted_docs, list):
        raise HTTPException(status_code=422, detail="'extracted_docs' must be a list.")
    result = check_documents(body.extracted_docs, body.case_form)
    return JSONResponse(content=result)
