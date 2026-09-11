from app.chat.models.models import GraphState, Message
from app.chat.logger import get_logger

logger = get_logger("history_recorder")


def history_recorder_node(state: GraphState) -> GraphState:
    """Append the assistant reply to conversation history so the checkpointer persists it."""
    if state.final_response:
        state.history.append(Message(role="assistant", content=state.final_response))
        logger.debug(f"[{state.session_id}] Recorded assistant reply to history")
    else:
        logger.debug(f"[{state.session_id}] No final_response to record")

    return {}
    # return state
