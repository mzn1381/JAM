from app.chat.models.models import GraphState
from app.chat.utils.conversation import build_llm_messages
from app.chat.logger import get_logger

logger = get_logger("chitchat")

_CHITCHAT_PROMPT = """
The user is having a general conversation that is not directly related to a specific service.
Respond in a friendly, helpful, and natural tone in Persian (فارسی).
If the user could benefit from assistant features (doctor appointment/نوبت پزشک, inquiry/استعلام, android/آلارم, etc.), politely guide them.
Return only the response text, without JSON.
"""


def chitchat_node(state: GraphState, llm) -> GraphState:
    logger.info(f"Chitchat for input: '{state.user_input}'")
    state.final_response = llm.complete(_CHITCHAT_PROMPT.strip(), build_llm_messages(state))
    return state
