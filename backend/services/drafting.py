"""
Draft generation service using Gemini.
Falls back to a realistic hardcoded cheque-bounce demo draft when the API
key is missing or an error occurs.
"""
from __future__ import annotations

import json
import os
from typing import Any

from config import GEMINI_API_KEY, MODEL_NAME

_RULES_DIR = os.path.join(os.path.dirname(__file__), "..", "rules")


def _load_sections(case_type: str) -> list[dict]:
    path = os.path.join(_RULES_DIR, "sections.json")
    with open(path, encoding="utf-8") as fh:
        all_sections: dict[str, list] = json.load(fh)
    return all_sections.get(case_type, [])


DEMO_DRAFT = """\
LEGAL NOTICE
(DEMO MODE — SAMPLE DRAFT)

From:
Ramesh Patil
123, Gandhi Nagar, Pune - 411001

To:
Suresh Sharma
456, MG Road, Pune - 411002

Sub: Legal Notice under Section 138 of the Negotiable Instruments Act, 1881 for
     dishonour of Cheque No. 123456 dated 15-03-2024 for Rs. 50,000/-

Sir,

Under the instructions of my client, Shri Ramesh Patil, I hereby serve upon you
the following legal notice:

1. That my client and you entered into a financial agreement dated 01-01-2024
   whereby you agreed to repay a sum of Rs. 50,000/- (Rupees Fifty Thousand Only)
   to my client.

2. That in discharge of the said liability, you issued Cheque No. 123456 drawn on
   State Bank of India, Pune Branch, dated 15-03-2024 for Rs. 50,000/-.

3. That on presentation of the said cheque, the same was returned dishonoured by
   the bank on 18-03-2024 with the remark "Funds Insufficient".

4. You are, therefore, hereby called upon to pay the said amount of Rs. 50,000/-
   to my client within FIFTEEN (15) days from the receipt of this notice, failing
   which my client shall be constrained to initiate criminal proceedings against you
   under Section 138 of the Negotiable Instruments Act, 1881, without further notice.

Please govern yourself accordingly.

Dated: ___________

Advocate for the Complainant

[AI-GENERATED DRAFT — ADVOCATE REVIEW REQUIRED BEFORE USE]
"""

DEMO_CLIENT_SUMMARY = (
    "आपके मुवक्किल को एक चेक बाउंस के मामले में कानूनी नोटिस भेजा गया है। "
    "इस नोटिस में 15 दिनों के भीतर ₹50,000 चुकाने की मांग की गई है। "
    "यदि भुगतान नहीं हुआ, तो धारा 138 के तहत आपराधिक मामला दायर किया जाएगा।"
)

DRAFTING_PROMPT = """\
You are an experienced Indian legal advocate drafting a {draft_type} in {language}.

CASE DETAILS:
- Case Type: {case_type}
- Client Name: {client_name}
- Client Address: {client_address}
- Opposite Party Name: {opposite_party_name}
- Opposite Party Address: {opposite_party_address}
- Key Facts: {key_facts}
- Demand / Relief: {demand}
- Time Limit to Comply: {time_limit} days

DOCUMENT EXTRACTS:
{doc_extracts}

APPLICABLE SECTIONS:
{sections}

INSTRUCTIONS:
1. Write a formal, complete {draft_type} suitable for Indian courts.
2. Use proper legal formatting with numbered paragraphs.
3. Reference the applicable sections provided.
4. Demand the stated relief within the stated time limit.
5. End with a clear consequence if the demand is not met.
6. After the draft, provide a JSON block at the end in this exact format:
   ###CLIENT_SUMMARY###
   <A simple 3-4 sentence explanation in {language} suitable for a layperson client>
   ###END_SUMMARY###

Do not add any disclaimers inside the draft body itself.
"""


def _build_fallback_draft(case_form: dict) -> str:
    """Create a useful text-only fallback without pretending API data is verified."""
    draft_type = case_form.get("draft_type", "Legal Draft")
    case_type = str(case_form.get("case_type", "other")).replace("_", " ").title()
    client_name = case_form.get("client_name", "the client")
    client_address = case_form.get("client_address", "[Client address]")
    opposite_name = case_form.get(
        "opposite_party_name", case_form.get("opp_name", "[Opposite party]")
    )
    opposite_address = case_form.get(
        "opposite_party_address", case_form.get("opp_address", "[Opposite party address]")
    )
    key_facts = case_form.get("key_facts", "[Key facts]")
    demand = case_form.get("demand", "[Demand or relief]")
    time_limit = case_form.get("time_limit_days", case_form.get("time_limit", 15))
    return f"""\
{draft_type.upper()}
(DEMO MODE — SAMPLE DRAFT)

From:
{client_name}
{client_address}

To:
{opposite_name}
{opposite_address}

Sub: {draft_type} concerning {case_type}

Sir/Madam,

Under instructions from and on behalf of my client, {client_name}, I hereby communicate the following:

1. {key_facts}

2. The relevant case may involve the following relief or demand: {demand}

3. You are therefore called upon to comply within {time_limit} days from receipt of this communication. If you fail to comply, the client reserves the right to take appropriate legal action.

Please govern yourself accordingly.

Dated: ___________

Advocate for {client_name}

[AI-GENERATED DRAFT — ADVOCATE REVIEW REQUIRED BEFORE USE]
"""


def _build_prompt(case_form: dict, documents: list[dict], sections: list[dict]) -> str:
    doc_extracts = "\n".join(
        f"- [{d.get('doc_type', 'doc')}]: {json.dumps(d.get('fields', d), ensure_ascii=False)}"
        for d in documents
    )
    sections_text = "\n".join(
        f"- {s['section']}, {s['act']}: {s['explanation']}" for s in sections
    )
    return DRAFTING_PROMPT.format(
        draft_type=case_form.get("draft_type", "Legal Notice"),
        language=case_form.get("language", case_form.get("draft_language", "English")),
        case_type=case_form.get("case_type", "other"),
        client_name=case_form.get("client_name", ""),
        client_address=case_form.get("client_address", ""),
        opposite_party_name=case_form.get(
            "opposite_party_name", case_form.get("opp_name", "")
        ),
        opposite_party_address=case_form.get(
            "opposite_party_address", case_form.get("opp_address", "")
        ),
        key_facts=case_form.get("key_facts", ""),
        demand=case_form.get("demand", ""),
        time_limit=case_form.get("time_limit_days", case_form.get("time_limit", 15)),
        doc_extracts=doc_extracts or "None provided.",
        sections=sections_text or "None.",
    )


def _split_summary(text: str) -> tuple[str, str]:
    """Split Gemini response into draft text and client summary."""
    if "###CLIENT_SUMMARY###" in text:
        parts = text.split("###CLIENT_SUMMARY###", 1)
        draft = parts[0].strip()
        rest = parts[1].split("###END_SUMMARY###", 1)
        summary = rest[0].strip()
        return draft, summary
    return text.strip(), ""


async def generate_draft(case_form: dict, documents: list[dict], sections: list[dict]) -> dict:
    """
    Returns::

        {
            "draft_text": str,
            "suggested_sections": [...],
            "client_summary": str,
            "is_demo": bool,
        }
    """
    case_type = case_form.get("case_type", "other")
    suggested_sections = _load_sections(case_type)

    if not GEMINI_API_KEY:
        return {
            "draft_text": _build_fallback_draft(case_form),
            "suggested_sections": suggested_sections,
            "client_summary": "यह एक डेमो मसौदा है। कृपया facts, dates, party names और मांग की जांच करें, और अदालत में दाखिल करने से पहले अपने अधिवक्ता से समीक्षा करवाएं।",
            "is_demo": True,
        }

    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(MODEL_NAME)

        prompt = _build_prompt(case_form, documents, sections)
        response = model.generate_content(prompt)
        draft_text, client_summary = _split_summary(response.text)

        return {
            "draft_text": draft_text,
            "suggested_sections": suggested_sections,
            "client_summary": client_summary,
            "is_demo": False,
        }

    except Exception:
        return {
            "draft_text": _build_fallback_draft(case_form),
            "suggested_sections": suggested_sections,
            "client_summary": "यह एक डेमो मसौदा है। कृपया facts, dates, party names और मांग की जांच करें, और अदालत में दाखिल करने से पहले अपने अधिवक्ता से समीक्षा करवाएं।",
            "is_demo": True,
        }
