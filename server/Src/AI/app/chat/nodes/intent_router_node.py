from pydantic import BaseModel, Field

from app.chat.models.models import GraphState, IntentResult, IntentCategory
from app.chat.api.registry import (
    CLASSIFIER_HINT,
    VALID_INTENT_NAMES,
    get_classifier_categories_with_examples,
)
from app.chat.utils.conversation import build_llm_messages
from app.chat.logger import get_logger

logger = get_logger("intent_classifier")


class _IntentRouterStructuredOutput(BaseModel):
    category: str = Field("chitchat", description="The selected intent category name")
    confidence: float = Field(1.0, description="Confidence score from 0 to 1")
    reasoning: str = Field("", description="Short explanation in Persian")


def _format_category(cat: dict) -> str:
    lines = [f"- {cat['name']}: {cat['description']}"]
    if cat.get("examples"):
        examples = " | ".join(f"«{phrase}»" for phrase in cat["examples"])
        lines.append(f"  Examples: {examples}")
    return "\n".join(lines)


def _build_prompt(state: GraphState) -> str:
    categories_desc = "\n".join(
        _format_category(cat) for cat in get_classifier_categories_with_examples()
    )

    hint_section = f"\n{CLASSIFIER_HINT}\n" if CLASSIFIER_HINT else ""

    return f"""You are an intent classifier. Based on the conversation history (user and assistant messages), determine the user's intent.

Categories:
{categories_desc}
{hint_section}
Output JSON only, no extra text:
{{"category": "<name>", "confidence": <0-1>, "reasoning": "<short explanation in Persian (فارسی)>"}}"""


def _resolve_category(result: _IntentRouterStructuredOutput) -> tuple[str, float, str]:
    category = result.category
    if category not in VALID_INTENT_NAMES:
        logger.warning(f"Intent classifier returned invalid category: {category!r}")
        category = "chitchat"

    confidence = result.confidence
    try:
        confidence = float(confidence) if confidence is not None else 1.0
    except (TypeError, ValueError):
        confidence = 1.0

    return category, confidence, result.reasoning


def intent_classifier_node(state: GraphState, llm) -> GraphState:
    prompt = _build_prompt(state)
    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _IntentRouterStructuredOutput,
    )
    category, confidence, reasoning = _resolve_category(result)

    logger.info(
        f"Intent: {category} | confidence: {confidence} | "
        f"reasoning: {reasoning} | input: '{state.user_input}'"
    )

    state.intent = IntentResult(
        category=IntentCategory(category),
        confidence=confidence,
        reasoning=reasoning,
    )

    return state
