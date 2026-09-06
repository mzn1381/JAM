from app.chat.models.models import GraphState
from app.chat.utils.conversation import build_llm_messages
from app.chat.utils.faq_retriever import get_faq_retriever
from app.chat.logger import get_logger

logger = get_logger("paziresh_faq")

_FAQ_PROMPT = """
The user has an informational question about the Paziresh24 (پذیرش۲۴) system.
Using the related Q&A entries below, provide an accurate, helpful answer in Persian (فارسی).

Rules:
- Answer only based on the provided information; if the answer is insufficient, say so honestly.
- Use a friendly and fluent tone.
- If the user could benefit from doctor search or appointment booking (جستجوی پزشک / رزرو نوبت), briefly suggest it at the end.
- Return only the response text, without JSON.
"""


def _format_retrieved_context(entries) -> str:
    parts = []
    for index, entry in enumerate(entries, start=1):
        parts.append(f"{index}. Question (سوال): {entry.question}\n   Answer (پاسخ): {entry.answer}")
    return "\n\n".join(parts)


def paziresh_faq_node(state: GraphState, llm) -> GraphState:
    state.emit_progress("سوال شما درباره پذیرش۲۴ را بررسی می‌کنم...", step="start")

    retriever = get_faq_retriever()
    retrieved = retriever.retrieve(state.user_input, top_k=3)
    logger.info(
        f"FAQ retrieval | top scores: "
        f"{[(entry.question[:40], round(entry.score, 3)) for entry in retrieved]}"
    )

    context = _format_retrieved_context(retrieved)
    state.emit_progress("پاسخ مناسب از مستندات پذیرش۲۴ پیدا شد.", step="retrieval")

    prompt = (
        f"{_FAQ_PROMPT.strip()}\n\n"
        f"Related Q&A (سوالات و پاسخ‌های مرتبط):\n{context}"
    )
    state.final_response = llm.complete(prompt, build_llm_messages(state))
    return state
