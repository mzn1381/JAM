from app.chat.models.models import GraphState
from app.chat.utils.safeguard_rules import check_safeguard
from app.chat.utils.metrics import record_safeguard_block, record_safeguard_pass
from app.chat.logger import get_logger

logger = get_logger("safeguard")


def safeguard_node(state: GraphState) -> GraphState:
    blocked, reason, message = check_safeguard(state.user_input)

    if blocked:
        state.safeguard_blocked = True
        state.safeguard_reason = reason
        state.final_response = message
        record_safeguard_block(reason=reason, session_id=state.session_id)
        logger.warning(
            f"Safeguard blocked | reason={reason} | session_id={state.session_id} | "
            f"input='{state.user_input}'"
        )
    else:
        state.safeguard_blocked = False
        state.safeguard_reason = ""
        record_safeguard_pass(session_id=state.session_id)
        logger.debug(
            f"Safeguard passed | session_id={state.session_id} | input='{state.user_input}'"
        )

    return state


def route_after_safeguard(state: GraphState) -> str:
    if state.safeguard_blocked:
        return "blocked"
    return "continue"
