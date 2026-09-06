import re

from pydantic import BaseModel, Field

from app.chat.models.models import GraphState, InquirySelectionResult
from app.chat.api.registry import INQUIRY_CATEGORY
from app.chat.utils.conversation import build_llm_messages
from app.chat.utils.text_normalizer import normalize_text
from app.chat.logger import get_logger

logger = get_logger("inquiry_resolver")


class _InquiryResolverStructuredOutput(BaseModel):
    api_name: str = Field("", description="Selected inquiry API name, or empty when unresolved")
    is_resolved: bool = Field(False, description="True when the inquiry API is clear")
    confidence: float = Field(0.0, description="Confidence score from 0 to 1")
    reason: str = Field("", description="Short explanation in Persian")
    clarification_question: str = Field(
        "",
        description="Persian clarification question when unresolved",
    )


INQUIRY_TYPE_QUESTION = """برای انجام استعلام، لطفاً مشخص کنید کدام مورد را می‌خواهید:
• قبض آب
• قبض برق
• قبض گاز
• خلافی خودرو
• پلاک‌های فعال
• پیگیری مرسوله پستی
• استعلام چک صیادی"""

# More specific phrases first to reduce false positives.
_INQUIRY_KEYWORD_RULES: list[tuple[str, list[str]]] = [
    ("post_api_sw1_PostalTracking", ["مرسوله پست", "بسته پست", "پیگیری پست", "کد رهگیری", "رهگیری پست", "پستی"]),
    ("post_api_sw1_ChequeInfo", ["چک صیاد", "چک صیادی", "شناسه چک", "استعلام چک", "صیادی"]),
    ("post_api_sw1_VehicleViolation", ["خلافی", "تخلف", "خلافی خودرو", "خلافی ماشین"]),
    ("post_api_sw1_ActivePlates", ["پلاک فعال", "پلاک‌های فعال", "پلاک های فعال", "لیست پلاک", "پلاک خودرو", "پلاک ماشین", "پلاک"]),
    ("post_api_sw1_WatterBill", ["قبض آب", "استعلام آب", "بدهی آب", "آب", "اب"]),
    ("post_api_sw1_PowerBill", ["قبض برق", "استعلام برق", "بدهی برق", "برق"]),
    ("post_api_sw1_GasBill", ["قبض گاز", "استعلام گاز", "بدهی گاز", "گاز"]),
]

INQUIRY_LABELS: dict[str, str] = {
    "post_api_sw1_PostalTracking": "پیگیری مرسوله پستی",
    "post_api_sw1_ChequeInfo": "استعلام چک صیادی",
    "post_api_sw1_VehicleViolation": "خلافی خودرو",
    "post_api_sw1_ActivePlates": "پلاک‌های فعال",
    "post_api_sw1_WatterBill": "قبض آب",
    "post_api_sw1_PowerBill": "قبض برق",
    "post_api_sw1_GasBill": "قبض گاز",
}

_BILL_APIS = {
    "post_api_sw1_WatterBill",
    "post_api_sw1_PowerBill",
    "post_api_sw1_GasBill",
}

_BILL_TYPE_SHORT_ALIASES: dict[str, list[str]] = {
    "post_api_sw1_WatterBill": ["آب", "اب"],
    "post_api_sw1_PowerBill": ["برق"],
    "post_api_sw1_GasBill": ["گاز"],
}

_GENERIC_INQUIRY_WORDS = ("استعلام", "بگیر", "بده", "میخوام", "می‌خوام", "بررسی", "چک کن", "ببین")


def _build_context_text(state: GraphState) -> str:
    user_parts = [msg.content for msg in state.history if msg.role == "user"][-4:]
    return " ".join(user_parts + [state.user_input])


def _match_inquiry_apis(text: str) -> list[str]:
    normalized_text = normalize_text(text)
    matched: list[str] = []
    for api_name, keywords in _INQUIRY_KEYWORD_RULES:
        if any(normalize_text(keyword) in normalized_text for keyword in keywords):
            matched.append(api_name)
    return matched


def _match_short_bill_type(user_input: str) -> str | None:
    stripped = normalize_text(user_input.strip())
    for api_name, aliases in _BILL_TYPE_SHORT_ALIASES.items():
        if stripped in aliases:
            return api_name
    return None


def _context_suggests_bill_inquiry(context: str) -> bool:
    normalized = normalize_text(context)
    return any(token in normalized for token in ("قبض", "استعلام", "بدهی"))


def _is_identifier_only(text: str) -> bool:
    stripped = text.strip()
    if not stripped:
        return False

    long_numbers = re.findall(r"\d{5,}", stripped)
    if not long_numbers:
        return False

    letters = re.sub(r"[\d\s\W_]", "", stripped, flags=re.UNICODE)
    meaningful = letters
    for generic in _GENERIC_INQUIRY_WORDS:
        meaningful = meaningful.replace(generic, "")

    return len(meaningful.strip()) <= 3


def _has_bare_number_without_type(context: str) -> bool:
    if not re.search(r"\d{5,}", context):
        return False
    return len(_match_inquiry_apis(context)) == 0


def _build_type_question(candidates: list[str] | None = None) -> str:
    if not candidates:
        return INQUIRY_TYPE_QUESTION

    lines = ["لطفاً نوع استعلام را مشخص کنید:"]
    for api_name in candidates:
        label = INQUIRY_LABELS.get(api_name, api_name)
        lines.append(f"• {label}")
    return "\n".join(lines)


def _resolve_by_keywords(state: GraphState) -> InquirySelectionResult | None:
    context = _build_context_text(state)

    short_bill = _match_short_bill_type(state.user_input)
    if short_bill and _context_suggests_bill_inquiry(context):
        logger.info(f"Inquiry resolved by short bill reply | api={short_bill}")
        return InquirySelectionResult(
            api_name=short_bill,
            is_resolved=True,
            confidence=1.0,
            reason="short_bill_type_reply",
        )

    matched = _match_inquiry_apis(context)

    if len(matched) == 1:
        logger.info(f"Inquiry resolved by keyword | api={matched[0]}")
        return InquirySelectionResult(
            api_name=matched[0],
            is_resolved=True,
            confidence=1.0,
            reason="keyword_match",
        )

    if len(matched) > 1:
        bill_matches = [api for api in matched if api in _BILL_APIS]
        non_bill = [api for api in matched if api not in _BILL_APIS]
        if len(bill_matches) > 1 and not non_bill:
            logger.info(f"Inquiry ambiguous bill types | matches={bill_matches}")
            return InquirySelectionResult(
                is_resolved=False,
                clarification_question=_build_type_question(bill_matches),
                reason="ambiguous_bill_type",
            )
        logger.info(f"Inquiry ambiguous types | matches={matched}")
        return InquirySelectionResult(
            is_resolved=False,
            clarification_question=_build_type_question(matched),
            reason="ambiguous_keyword_match",
        )

    if _is_identifier_only(state.user_input) or _has_bare_number_without_type(context):
        logger.info("Inquiry unresolved: identifier only without type")
        return InquirySelectionResult(
            is_resolved=False,
            clarification_question=INQUIRY_TYPE_QUESTION,
            reason="identifier_only",
        )

    generic_only = any(word in state.user_input for word in _GENERIC_INQUIRY_WORDS)
    if generic_only and not re.search(r"\d{5,}", context):
        logger.info("Inquiry unresolved: generic request without type")
        return InquirySelectionResult(
            is_resolved=False,
            clarification_question=INQUIRY_TYPE_QUESTION,
            reason="generic_inquiry_request",
        )

    return None


def _resolve_by_llm(state: GraphState, llm) -> InquirySelectionResult:
    api_options = "\n".join(
        f"- {api.name}: {INQUIRY_LABELS.get(api.name, api.description[:80])}"
        for api in INQUIRY_CATEGORY.apis
    )

    prompt = f"""
Determine the user's inquiry type from the conversation.

Available services:
{api_options}

Important rules:
- If only a number/ID/code is given and the inquiry type (water/آب, electricity/برق, gas/گاز, postal/پست, cheque/چک, violation/خلافی, ...) is not specified → is_resolved=false
- If the user only said something like «استعلام بگیر» (run an inquiry) or similar without specifying the type → is_resolved=false
- If the inquiry type is clear from history or the current message → is_resolved=true
- For water/electricity/gas bills (قبض آب/برق/گاز), the bill type must be specified; bill ID alone is not enough
- Provide api_name only when is_resolved=true

Output JSON:
{{
  "api_name": "<name or empty>",
  "is_resolved": true/false,
  "confidence": <0-1>,
  "reason": "<short explanation in Persian (فارسی)>",
  "clarification_question": "<Persian question if is_resolved=false>"
}}
"""

    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _InquiryResolverStructuredOutput,
    )
    is_resolved = bool(result.is_resolved)
    confidence = float(result.confidence or 0)
    api_name = result.api_name or ""
    valid_api_names = {api.name for api in INQUIRY_CATEGORY.apis}

    if is_resolved and api_name in valid_api_names and confidence >= 0.8:
        logger.info(f"Inquiry resolved by LLM | api={api_name} | confidence={confidence}")
        return InquirySelectionResult(
            api_name=api_name,
            is_resolved=True,
            confidence=confidence,
            reason=result.reason or "llm_match",
        )

    question = result.clarification_question or INQUIRY_TYPE_QUESTION
    logger.info(
        f"Inquiry unresolved by LLM | api={api_name!r} | confidence={confidence} | "
        f"reason={result.reason}"
    )
    return InquirySelectionResult(
        is_resolved=False,
        clarification_question=question,
        reason=result.reason or "llm_unresolved",
    )


def resolve_inquiry_api(state: GraphState, llm) -> InquirySelectionResult:
    keyword_result = _resolve_by_keywords(state)
    if keyword_result is not None and keyword_result.is_resolved == True:
        return keyword_result
    return _resolve_by_llm(state, llm)
