"""Routes: POST /api/cases  GET /api/cases"""
from __future__ import annotations

import os
import sqlite3
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "cases.db")


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    conn = _get_connection()
    with conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cases (
                id          TEXT PRIMARY KEY,
                timestamp   REAL NOT NULL,
                client_name TEXT NOT NULL,
                case_type   TEXT NOT NULL,
                draft_text  TEXT NOT NULL
            )
            """
        )
    conn.close()


# Initialise on import
_init_db()


class SaveCaseRequest(BaseModel):
    client_name: str
    case_type: str
    draft_text: str
    case_form: dict[str, Any] = {}


@router.post("/cases", status_code=201)
async def save_case(body: SaveCaseRequest) -> JSONResponse:
    case_id = str(uuid.uuid4())
    ts = time.time()
    conn = _get_connection()
    try:
        with conn:
            conn.execute(
                "INSERT INTO cases (id, timestamp, client_name, case_type, draft_text) VALUES (?,?,?,?,?)",
                (case_id, ts, body.client_name, body.case_type, body.draft_text),
            )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {exc}") from exc
    finally:
        conn.close()
    return JSONResponse(
        status_code=201,
        content={"id": case_id, "timestamp": ts, "message": "Case saved successfully."},
    )


@router.get("/cases")
async def list_cases() -> JSONResponse:
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT id, timestamp, client_name, case_type FROM cases ORDER BY timestamp DESC"
        ).fetchall()
    finally:
        conn.close()
    cases = [dict(row) for row in rows]
    return JSONResponse(content={"cases": cases, "total": len(cases)})
