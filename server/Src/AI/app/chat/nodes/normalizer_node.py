from app.chat.models.models import GraphState, Message
from app.chat.utils.text_normalizer import normalize_text
from app.chat.logger import get_logger

logger = get_logger("normalizer")


def normalizer_node(state: GraphState) -> GraphState:
    state.raw_user_input = state.user_input
    normalized = normalize_text(state.user_input)

    if normalized != state.raw_user_input:
        logger.info(f"Normalized input: '{state.raw_user_input}' -> '{normalized}'")
    else:
        logger.debug(f"Input unchanged after normalization: '{normalized}'")

    state.user_input = normalized
    state.history.append(Message(role="user", content=normalized))

    return state
