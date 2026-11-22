"""Route: POST /api/draft"""
from __future__ import annotations

import json
import os
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from services.drafting import generate_draft

router = APIRouter()

_RULES_DIR = os.path.join(os.path.dirname(__file__), "..", "rules")


def _load_sections(case_type: str) -> list[dict]:
    path = os.path.join(_RULES_DIR, "sections.json")
    with open(path, encoding="utf-8") as fh:
        all_sections: dict[str, list] = json.load(fh)
    return all_sections.get(case_type, [])


class DraftRequest(BaseModel):
    case_form: dict[str, Any]
    documents: list[dict[str, Any]] = []


@router.post("/draft")
async def draft(body: DraftRequest) -> JSONResponse:
    case_type = body.case_form.get("case_type", "other")
    sections = _load_sections(case_type)

    result = await generate_draft(body.case_form, body.documents, sections)
    return JSONResponse(content=result)
