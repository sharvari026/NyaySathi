"""
Document extraction service using Gemini Vision API.
Falls back to realistic demo data when API key is missing or an error occurs.
"""
from __future__ import annotations

import json
import re
from typing import Any

from config import GEMINI_API_KEY, MODEL_NAME

# ---------------------------------------------------------------------------
# Demo / fallback data
# ---------------------------------------------------------------------------

DEMO_DATA: dict[str, dict[str, Any]] = {
    "cheque": {
        "person_names": ["Ramesh Patil"],
        "dates": ["2024-03-15"],
        "amounts": ["50000"],
        "identifiers": {"cheque_no": "123456", "account_no_last4": "7890"},
        "bank_or_office": "State Bank of India",
        "signature_visible": False,
        "stamp_or_seal_visible": True,
        "image_quality": "good",
        "notes": "Signature field appears blank.",
        "is_demo": True,
    },
    "bank_return_memo": {
        "person_names": ["Ramesh Patel"],
        "dates": ["2024-03-18"],
        "amounts": ["50000"],
        "identifiers": {},
        "bank_or_office": "State Bank of India",
        "signature_visible": True,
        "stamp_or_seal_visible": True,
        "image_quality": "good",
        "notes": "",
        "is_demo": True,
    },
    "id_proof": {
        "person_names": ["Ramesh Patil"],
        "dates": ["Not clear"],
        "amounts": [],
        "identifiers": {},
        "bank_or_office": "",
        "signature_visible": True,
        "stamp_or_seal_visible": True,
        "image_quality": "good",
        "notes": "",
        "is_demo": True,
    },
    "712_extract": {
        "person_names": ["Suresh Kumar"],
        "dates": ["2023-01-10"],
        "amounts": [],
        "identifiers": {"survey_no": "45/A", "plot_no": "Not clear"},
        "bank_or_office": "Tahsildar Office",
        "signature_visible": True,
        "stamp_or_seal_visible": True,
        "image_quality": "blurry",
        "notes": "Image is blurry, survey number may be inaccurate.",
        "is_demo": True,
    },
    "sale_deed": {
        "person_names": ["Suresh Kumar"],
        "dates": [],
        "amounts": ["250000"],
        "identifiers": {"survey_no": "45/A"},
        "bank_or_office": "Sub-Registrar Office",
        "signature_visible": True,
        "stamp_or_seal_visible": True,
        "image_quality": "good",
        "notes": "Date of execution not clearly visible.",
        "is_demo": True,
    },
    "default": {
        "person_names": ["Not clear"],
        "dates": [],
        "amounts": [],
        "identifiers": {},
        "bank_or_office": "Not clear",
        "signature_visible": "not clear",
        "stamp_or_seal_visible": "not clear",
        "image_quality": "good",
        "notes": "Demo mode.",
        "is_demo": True,
    },
}

EXTRACTION_PROMPT = (
    "You are reading a photo of an Indian legal or government document of type: {doc_type}. "
    "Return only JSON with keys: person_names (list), dates (list), amounts (list), "
    "identifiers (survey_no, plot_no, cheque_no, account_no_last4), bank_or_office (str), "
    "signature_visible (bool or 'not clear'), stamp_or_seal_visible (bool or 'not clear'), "
    "image_quality ('good'|'blurry'|'cropped'|'unreadable'), notes (str). "
    "If value not clearly readable use 'Not clear'. Do not guess."
)


def _get_demo(doc_type: str) -> dict[str, Any]:
    data = DEMO_DATA.get(doc_type, DEMO_DATA["default"]).copy()
    data["is_demo"] = True
    return data


def _parse_json_from_text(text: str) -> dict:
    """Extract the first JSON object from a Gemini text response."""
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?", "", text).strip().rstrip("`")
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


async def extract_document(file_bytes: bytes, doc_type: str, mime_type: str) -> dict:
    """
    Extract structured fields from a document image/PDF using Gemini Vision.
    Returns a dict with extracted fields plus ``is_demo`` bool.
    """
    if not GEMINI_API_KEY:
        return _get_demo(doc_type)

    try:
        import google.generativeai as genai  # type: ignore
        from google.generativeai import types as gtypes  # type: ignore

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)

        prompt = EXTRACTION_PROMPT.format(doc_type=doc_type)

        blob = gtypes.BlobDict(mime_type=mime_type, data=file_bytes)  # type: ignore
        response = model.generate_content([prompt, blob])  # type: ignore

        result = _parse_json_from_text(response.text)
        result["is_demo"] = False
        return result

    except Exception:
        return _get_demo(doc_type)
