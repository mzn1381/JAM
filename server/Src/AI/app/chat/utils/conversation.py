from app.chat.models.models import GraphState, Message

DEFAULT_USER_HISTORY_LIMIT = 4


def get_last_user_messages(history: list[Message], limit: int = DEFAULT_USER_HISTORY_LIMIT) -> list[str]:
    user_msgs = [msg.content for msg in history if msg.role == "user"]
    return user_msgs[-limit:]


def format_user_history(history: list[Message], limit: int = DEFAULT_USER_HISTORY_LIMIT) -> str:
    """Format recent user turns for keyword/heuristic context (not for LLM prompts)."""
    recent = get_last_user_messages(history, limit)
    if not recent:
        return "پیامی ثبت نشده است."
    return "\n".join(f"{index}. {content}" for index, content in enumerate(recent, start=1))


def build_llm_messages(state: GraphState, max_user_messages: int = DEFAULT_USER_HISTORY_LIMIT) -> list[dict]:
    """Build multi-turn messages from prior conversation (user + assistant turns).

    Conversation context lives only here — not duplicated in the system prompt.
    """
    if not state.history:
        return [{"role": "user", "content": state.user_input}]

    user_count = 0
    start_idx = len(state.history)

    for index in range(len(state.history) - 1, -1, -1):
        if state.history[index].role == "user":
            user_count += 1
            start_idx = index
            if user_count >= max_user_messages:
                break

    window = state.history[start_idx:]
    messages = [{"role": msg.role, "content": msg.content} for msg in window]

    if not messages or messages[-1]["role"] != "user" or messages[-1]["content"] != state.user_input:
        messages.append({"role": "user", "content": state.user_input})

    return messages
