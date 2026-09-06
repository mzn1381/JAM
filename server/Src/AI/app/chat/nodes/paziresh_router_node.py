from pydantic import BaseModel, Field

from app.chat.models.models import GraphState, PazireshSubIntent
from app.chat.utils.conversation import build_llm_messages
from app.chat.logger import get_logger

logger = get_logger("paziresh_router")

_VALID_SUB_INTENTS = {PazireshSubIntent.RESERVATION.value, PazireshSubIntent.FAQ.value}


class _PazireshRouterStructuredOutput(BaseModel):
    sub_intent: str = Field(
        PazireshSubIntent.RESERVATION.value,
        description="Either reservation or faq",
    )
    confidence: float = Field(1.0, description="Confidence score from 0 to 1")
    reasoning: str = Field("", description="Short explanation in Persian")


def _build_prompt(state: GraphState) -> str:
    return """The user is talking about the Paziresh24 (پذیرش۲۴ / P24) system.
Based on the conversation history, determine the request type:

- reservation: The user wants to find a doctor (پزشک), book an appointment (نوبت), search for a doctor/specialist (متخصص), or reserve a time slot.
  Examples: «یه دکتر تو تهران پیدا کن», «نوبت چشم‌پزشک می‌خوام», «برای سرماخوردگی پزشک در شیراز»

- faq: The user has an informational question about how Paziresh24 works, rules, cancel appointment (لغو نوبت), payment (پرداخت), insurance (بیمه), online visit (ویزیت آنلاین), emergency (اورژانس), etc.
  and does not have a specific doctor search or appointment booking request.
  Examples: «پذیرش۲۴ چیه؟», «چطور نوبتم رو لغو کنم؟», «آیا با بیمه می‌شه نوبت گرفت؟», «ویزیت آنلاین چطوره؟»

Output JSON:
{"sub_intent": "reservation" or "faq", "confidence": <0-1>, "reasoning": "<short explanation in Persian (فارسی)>"}"""


def paziresh_router_node(state: GraphState, llm) -> GraphState:
    prompt = _build_prompt(state)
    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _PazireshRouterStructuredOutput,
    )

    sub_intent = result.sub_intent
    if sub_intent not in _VALID_SUB_INTENTS:
        sub_intent = PazireshSubIntent.RESERVATION.value

    state.paziresh_sub_intent = PazireshSubIntent(sub_intent)
    logger.info(
        f"Paziresh sub-intent: {sub_intent} | confidence: {result.confidence} | "
        f"reasoning: {result.reasoning} | input: '{state.user_input}'"
    )
    return state


def route_paziresh_sub_intent(state: GraphState) -> str:
    if state.paziresh_sub_intent == PazireshSubIntent.FAQ:
        return "paziresh_faq"
    return "appointment"
