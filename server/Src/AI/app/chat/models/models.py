from enum import Enum
from typing import Any, Callable

from pydantic import BaseModel, Field
from app.chat.logger import get_logger

_progress_logger = get_logger("progress")


class TaskItem(BaseModel):
    chatId: str
    message: str
    # intent: str | None = None
    # confidence: float | None = None
    # user_language: str | None = None


class ChatRequest(BaseModel):
    # chatId: str
    tasks: list[TaskItem]


class ResponseType(Enum):
    TEXT = "TEXT" # show to user in chat
    OTP = "OTP" # one-time password
    ON_DEVICE = "ON_DEVICE" # use the payload to call an Android API
    CONFIRMATION = "CONFIRMATION" # use confirmationMessage to ask user for confirmation
    LIST_OPTION = "LIST_OPTION" # use the ListOptions to show a list of options to the user, and ask for a selection
    CARD_VIEW = "CARD_VIEW" # use the CardView to show specific data of some selected item

class OTPResponse(BaseModel):
    length: int = 5
    expiresInSeconds: int = 60
    resendLabel: str | None = 'ارسال مجدد کد'
    text: str | None = 'کد تایید را وارد کنید'

class OnDeviceResponse(BaseModel):
     invocationJson: str

class ConfirmOption(BaseModel):
    id: str
    label: str
    icon: str
    variant: str

class ConfirmationResponse(BaseModel):
    text: str | None = None
    options: list[ConfirmOption]

class ListOptionItem(BaseModel):
    id: str
    title: str
    image: str | None = None
    subtitle: str | None = None
    subtitle2: str | None = None

class ListOptionType(Enum):
     DEFAULT = "DEFAULT"
     SIMPLE = "SIMPLE"

class ListOptionResponse(BaseModel):
    text: str | None = None
    defaultOptionId: str | None = None
    options: list[ListOptionItem]
    optionType: ListOptionType = ListOptionType.DEFAULT
    rawPayload: str | None = None

class CardViewType(Enum):
    DEFAULT = "DEFAULT"
    DOCTOR_PROFILE = "DOCTOR_PROFILE"

class CardMetric(BaseModel):
    label: str
    value: str

class CardViewResponse(BaseModel):
    id: str
    type: CardViewType = CardViewType.DEFAULT
    title: str
    subtitle: str | None = None
    text: str | None = None
    image: str | None = None
    primaryMetric: CardMetric | None = None
    secondaryMetric: CardMetric | None = None
    description: str | None = None
    actionLabel: str | None = None
    actionValue: str | None = None
    rawPayload: str | None = None
    # specfici to paziresh24 doctor profile card
    location: str | None = None
    rating: str | None = None

class GraphResult(BaseModel):
    toolType: ResponseType = ResponseType.TEXT
    text: str | None = None
    otpPayload : OTPResponse | None = None
    ondevicePayload : OnDeviceResponse | None = None
    confirmationPayload: ConfirmationResponse | None = None
    listOptionsPayload: ListOptionResponse | None = None
    cardViewPayload : CardViewResponse | None = None

class ToolCallResult(BaseModel):
    graph_result: GraphResult | None = None
    message: str | None = None
    success: bool = True

class ChatHandlerResult(BaseModel):
    tool_result: GraphResult | None = None
    final_response: str | None = None
    session_id: str | None = None
    success: bool = True

class ChatDataResponse(BaseModel):
	tools: list[GraphResult]
    
class IntentCategory(str, Enum):
    ANDROID = "android"
    GREETING = "greeting"
    CHITCHAT = "chitchat"
    INQUIRY = "inquiry"
    APPOINTMENT = "appointment"
    UNKNOWN = "unknown"
    REGISTERY_ARAD = "registery_arad"
    RAG="rag"
    ACTION="action"


class PazireshSubIntent(str, Enum):
    RESERVATION = "reservation"
    FAQ = "faq"


class IntentResult(BaseModel):
    category: IntentCategory
    confidence: float = 0.0
    reasoning: str = ""

class FilledSlot(BaseModel):
    name: str = Field(description="The slot name")
    value: str | int | float | bool | None = Field(
        description="The extracted value of the slot"
    )

class SlotFillerLLMStructuredOutput(BaseModel):
    slots: list[FilledSlot] = Field(default_factory=list, description="Filled slots with extracted values")
    is_complete: bool = Field(
        False,
        description="True only when every required slot is filled; optional slots do not affect completion",
    )
    missing_slots: list[str] = Field(
        default_factory=list,
        description="Names of missing required slots only; never include optional slots",
    )
    clarification_question: str = Field(
        "",
        description="Persian question asking only for missing required slots; empty when is_complete is true",
    )

class SlotFillerResult(SlotFillerLLMStructuredOutput):
    api_name: str

class InquirySelectionResult(BaseModel):
    api_name: str = ""
    is_resolved: bool = False
    confidence: float = 0.0
    clarification_question: str = ""
    reason: str = ""


class Message(BaseModel):
    role: str
    content: str


class GraphState(BaseModel):
    session_id: str
    user_input: str
    raw_user_input: str = ""
    history: list[Message] = []

    safeguard_blocked: bool = False
    safeguard_reason: str = ""

    intent: IntentResult | None = None
    paziresh_sub_intent: PazireshSubIntent | None = None
    slot_result: SlotFillerResult | None = None

    selected_api: str = ""

    # main response for graph
    response: GraphResult | None = None

    # raw response text, used for history_recorder_node
    final_response: str | None = None

    progress_messages: list[str] = []
    on_progress: Callable[[str], None] | None = Field(default=None, exclude=True)

    model_config = {"arbitrary_types_allowed": True}

    def emit_progress(self, message: str, step: str = "") -> None:
        self.progress_messages.append(message)
        log_msg = f"[{self.session_id}] {step} | {message}" if step else f"[{self.session_id}] {message}"
        _progress_logger.info(log_msg)
        if self.on_progress:
            self.on_progress(message)
