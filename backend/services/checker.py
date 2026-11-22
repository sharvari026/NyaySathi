"""
Document checker service.
Analyses extracted document data against case form requirements and returns
a checklist with red / yellow / green status items.
"""
from __future__ import annotations

import json
import os
import re
from typing import Any

_RULES_DIR = os.path.join(os.path.dirname(__file__), "..", "rules")


def _load_json(filename: str) -> dict:
    path = os.path.join(_RULES_DIR, filename)
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _normalise_name(name: str) -> str:
    """Lowercase, strip common honorifics and punctuation."""
    name = name.lower().strip()
    for title in ("shri", "smt", "mr", "mrs", "ms", "dr", "kumari", "adv", "advocate"):
        name = re.sub(rf"^{title}\.?\s+", "", name)
    name = re.sub(r"[^a-z ]", "", name)
    return name.strip()


def _edit_distance(a: str, b: str) -> int:
    """Simple O(nm) Levenshtein distance."""
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j] + (0 if ca == cb else 1), curr[j] + 1, prev[j + 1] + 1))
        prev = curr
    return prev[-1]


def _extract_number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).replace(",", "").strip()
    m = re.search(r"\d+(?:\.\d+)?", text)
    return float(m.group()) if m else None


def check_documents(extracted_docs: list[dict], case_form: dict) -> dict:
    """
    Returns::

        {
            "items": [{"id", "status", "message", "doc_ref"}, ...],
            "summary": {"red": N, "yellow": N, "green": N}
        }
    """
    case_types = _load_json("case_types.json")
    case_type = case_form.get("case_type", "other")
    required_docs: list[str] = case_types.get(case_type, {}).get("required_docs", [])
    client_name: str = case_form.get("client_name", "")
    demand_amount = _extract_number(case_form.get("demand_amount", ""))

    items: list[dict] = []
    counter = 0

    def add_item(status: str, message: str, doc_ref: str = "") -> None:
        nonlocal counter
        counter += 1
        items.append({"id": f"chk-{counter}", "status": status, "message": message, "doc_ref": doc_ref})

    # -----------------------------------------------------------------------
    # 1. Missing required documents
    # -----------------------------------------------------------------------
    uploaded_types = {d.get("doc_type", "") for d in extracted_docs}
    for req in required_docs:
        if req not in uploaded_types:
            add_item("red", f"Required document missing: {req.replace('_', ' ').title()}", req)
        else:
            add_item("green", f"Required document present: {req.replace('_', ' ').title()}", req)

    # -----------------------------------------------------------------------
    # 2. Per-document checks
    # -----------------------------------------------------------------------
    # Collect all names for cross-doc comparison
    all_names: list[tuple[str, str]] = []  # (normalised, doc_ref)
    if client_name:
        all_names.append((_normalise_name(client_name), "case_form"))

    for doc in extracted_docs:
        doc_ref = doc.get("doc_type", "unknown")
        fields = doc.get("fields", doc)  # support both wrapped and flat

        # -- image quality --
        quality = fields.get("image_quality", "good")
        if quality in ("blurry", "cropped", "unreadable"):
            add_item(
                "red",
                f"Image quality is '{quality}'. Please re-upload a clearer scan.",
                doc_ref,
            )
        else:
            add_item("green", "Image quality is acceptable.", doc_ref)

        # -- signature --
        sig = fields.get("signature_visible")
        if sig is None:
            sig = fields.get("signature_present")
        if sig is False or str(sig).lower() == "false":
            add_item("red", "Signature is missing on this document.", doc_ref)
        elif str(sig).lower() == "not clear":
            add_item("yellow", "Signature is not clearly visible. Verify the original.", doc_ref)
        else:
            add_item("green", "Signature is visible.", doc_ref)

        # -- dates --
        dates = fields.get("dates", [])
        if not dates or dates == ["Not clear"] or dates == []:
            add_item("yellow", "No dates could be read from this document. Verify manually.", doc_ref)

        # -- collect names --
        for name in fields.get("person_names", []):
            if name and name.lower() != "not clear":
                all_names.append((_normalise_name(name), doc_ref))

        # -- amount mismatch (cheque vs demand) --
        if doc_ref == "cheque" and demand_amount is not None:
            for amt_str in fields.get("amounts", []):
                cheque_amount = _extract_number(amt_str)
                if cheque_amount is not None and abs(cheque_amount - demand_amount) > 1:
                    add_item(
                        "yellow",
                        f"Cheque amount ({cheque_amount:.0f}) differs from demand amount ({demand_amount:.0f}). Verify.",
                        doc_ref,
                    )
                elif cheque_amount is not None:
                    add_item("green", f"Cheque amount matches demand amount ({demand_amount:.0f}).", doc_ref)

    # -----------------------------------------------------------------------
    # 3. Cross-document name comparison
    # -----------------------------------------------------------------------
    if len(all_names) >= 2:
        base_name, base_ref = all_names[0]
        for norm_name, ref in all_names[1:]:
            if norm_name == base_name:
                continue  # exact match — no problem
            dist = _edit_distance(base_name, norm_name)
            if dist <= 2:
                add_item(
                    "yellow",
                    f"Name spelling differs slightly between '{base_ref}' and '{ref}' "
                    f"('{base_name}' vs '{norm_name}'). Confirm it's the same person.",
                    ref,
                )
            else:
                add_item(
                    "red",
                    f"Name mismatch between '{base_ref}' and '{ref}': "
                    f"'{base_name}' vs '{norm_name}'. Please verify.",
                    ref,
                )

    # -----------------------------------------------------------------------
    # Build summary
    # -----------------------------------------------------------------------
    summary = {"red": 0, "yellow": 0, "green": 0}
    for it in items:
        summary[it["status"]] += 1

    return {"items": items, "summary": summary}
