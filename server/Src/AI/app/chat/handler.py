from typing import Any
import uuid
from openai import OpenAIError
from langchain_core.runnables import RunnableConfig

from app.chat.models.models import ChatHandlerResult, GraphState, Message
from app.chat.llm_client import LLMClient
from app.chat.graphs.builder import build_graph
from app.chat.logger import get_logger
from app.chat.models.models import GraphResult
from app.chat.nodes.appointment_node import get_doctor_profile
from app.chat.utils.faq_retriever import init_faq_retriever

logger = get_logger("handler")

SERVICE_UNAVAILABLE_MESSAGE = (
    "متأسفانه در حال حاضر سرویس قادر به پاسخگویی نیست. "
    "لطفاً کمی بعد دوباره تلاش کنید."
)

class ChatHandler:
    def __init__(self, base_url: str, api_key: str, model: str):
        logger.info("Initializing ChatHandler")
        self.llm = LLMClient(base_url=base_url, api_key=api_key, model=model)
        init_faq_retriever(self.llm)
        self.graph = build_graph(self.llm)

    def _checkpoint_config(self, session_id: str) -> RunnableConfig:
        return {"configurable": {"thread_id": session_id}}

    # def _load_history(self, config: RunnableConfig) -> list[Message]:
    #     snapshot = self.graph.get_state(config)
    #     values = snapshot.values or {}
    #     history = values.get("history", [])

    #     return self._coerce_history(history)

    # def _save_state_history(
    #     self,
    #     config: RunnableConfig,
    #     state: GraphState,
    #     result: Any,
    #     history: list[Message],
    # ) -> None:
    #     if isinstance(result, dict):
    #         values = {**state.model_dump(), **result}
    #     elif hasattr(result, "model_dump"):
    #         values = result.model_dump()
    #     else:
    #         values = state.model_dump()

    #     values["history"] = [message.model_dump() for message in history]
    #     values = GraphState.model_validate(values).model_dump(mode="json")
    #     self.graph.update_state(config, values)

    # def _coerce_history(self, history: list[Any] | None) -> list[Message]:
    #     return [
    #         item if isinstance(item, Message) else Message.model_validate(item)
    #         for item in history or []
    #         if item
    #     ]

    # def _get_result_history(self, result: Any, fallback: list[Message]) -> list[Message]:
    #     if hasattr(result, "history"):
    #         return self._coerce_history(result.history)
    #     if isinstance(result, dict):
    #         return self._coerce_history(result.get("history"))

    #     return fallback

    def _extract_result(self, result: Any) -> ChatHandlerResult:
        if result is None:
            return ChatHandlerResult(
                final_response=SERVICE_UNAVAILABLE_MESSAGE,
                session_id="",
                tool_result=None,
                success=False,
            )

        if hasattr(result, "response"):
            tool_result = getattr(result, "response", None)
        elif isinstance(result, dict):
            tool_result = result.get("response")

        if hasattr(result, "final_response"):
            final_response = getattr(result, "final_response", None)
        elif isinstance(result, dict):
            final_response = result.get("final_response")

        return ChatHandlerResult(
            final_response=final_response,
            session_id="",
            tool_result=tool_result,
            success=True,
        )

    def chat(self, user_input: str, session_id: str = None) -> ChatHandlerResult:
        if session_id is None:
            session_id = str(uuid.uuid4())
            logger.info(f"New session created: {session_id}")

        config = self._checkpoint_config(session_id)
        logger.debug(f"[{session_id}] User: {user_input}")

        parts = user_input.split("###")
        is_doctor_profile_shortcut = (
            user_input.startswith("###")
            and len(parts) >= 4
            and parts[1].lower() == "paziresh24"
            and parts[2].lower() == "doctorprofile"
        )

        result: Any = None
        final_response: str = SERVICE_UNAVAILABLE_MESSAGE
        tool_result: GraphResult | None = None

        try:
            if is_doctor_profile_shortcut:
                # Special ###Paziresh24###DoctorProfile###Slug branch — untouched.

                # history = self._load_history(config)
                # history.append(Message(role="user", content=user_input))
                state = GraphState(
                    session_id=session_id,
                    user_input=user_input,
                    # history=history,
                )
                slug = parts[3]
                result = get_doctor_profile(slug=slug, state=state)

                chatResult = self._extract_result(result)
                # history.append(Message(role="assistant", content=final_response))
                # self._save_state_history(config, state, result, history)
            else:
                # Normal path: let LangGraph's checkpointer merge with the prior
                # state for this thread. We only supply the current user input and
                # reset per-turn transient fields; history is appended inside
                # normalizer_node (user turn) and history_recorder_node (assistant turn).
                turn_input = {
                    "session_id": session_id,
                    "user_input": user_input,
                    "raw_user_input": "",
                    "intent": None,
                    "paziresh_sub_intent": None,
                    "slot_result": None,
                    "selected_api": "",
                    "response": None,
                    "final_response": None,
                    "progress_messages": [],
                    "safeguard_blocked": False,
                    "safeguard_reason": "",
                }
                result = self.graph.invoke(turn_input, config=config)  # type: ignore[arg-type]
                chatResult = self._extract_result(result)
        except OpenAIError as exc:
            logger.error(f"[{session_id}] LLM service unavailable | error={exc}")
            return ChatHandlerResult(
                final_response=SERVICE_UNAVAILABLE_MESSAGE,
                session_id=session_id,
                tool_result=None,
                success=False,
            )
        except Exception:
            logger.exception(f"[{session_id}] Chat processing failed")
            return ChatHandlerResult(
                final_response=SERVICE_UNAVAILABLE_MESSAGE,
                session_id=session_id,
                tool_result=None,
                success=False,
            )

        logger.debug(f"[{session_id}] Bot: {final_response}")

        chatResult.session_id = session_id

        return chatResult
