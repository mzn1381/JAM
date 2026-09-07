from app.chat.models.models import GraphState, GraphResult, ResponseType, ToolCallResult
from app.chat.api.registry import INQUIRY_CATEGORY
from app.chat.utils.slot_filler import fill_slots
from app.chat.utils.inquiry_resolver import resolve_inquiry_api, INQUIRY_LABELS
from app.chat.utils.conversation import build_llm_messages
from app.chat.tools.api_ir import ApiIrTools
from app.chat.logger import get_logger

logger = get_logger("inquiry")

_API_MAP = {
    "post_api_sw1_PostalTracking": ApiIrTools.post_api_sw1_PostalTracking,
    "post_api_sw1_ChequeInfo": ApiIrTools.post_api_sw1_ChequeInfo,
    "post_api_sw1_VehicleViolation": ApiIrTools.post_api_sw1_VehicleViolation,
    "post_api_sw1_ActivePlates": ApiIrTools.post_api_sw1_ActivePlates,
    "post_api_sw1_WatterBill": ApiIrTools.post_api_sw1_WatterBill,
    "post_api_sw1_PowerBill": ApiIrTools.post_api_sw1_PowerBill,
    "post_api_sw1_GasBill": ApiIrTools.post_api_sw1_GasBill,
}


_INQUIRY_GENERATION_PROMPT = """
Inquiry results have been received from the service. Based on the raw data below, write a fluent, clear, and helpful response in Persian (فارسی) for the user.

Rules:
- Present important information (amount/مبلغ, status/وضعیت, date/تاریخ, name/نام, address/آدرس, etc.) in simple language
- If there is an error or incomplete data, explain the reason in simple language
- Do not copy raw JSON; write only user-readable text
- Return only the response text, without JSON
"""


def _call_inquiry_api(api_name: str, slots: dict) -> str:
    func = _API_MAP.get(api_name)
    if not func:
        logger.warning(f"API not found: {api_name}")
        return f"سرویس '{api_name}' پیدا نشد."

    try:
        logger.info(f"Calling {api_name} with slots: {slots}")
        return func.invoke(slots)
    except KeyError as e:
        logger.error(f"Missing field in {api_name}: {e}")
        return f"اطلاعات ناقص است: {e}"
    except Exception as e:
        logger.error(f"Error in {api_name}: {e}")
        return f"خطا در فراخوانی سرویس: {e}"


def _generate_inquiry_response(state: GraphState, llm, api_name: str, raw_result: str) -> str:
    service_label = INQUIRY_LABELS.get(api_name, api_name)
    prompt = (
        f"{_INQUIRY_GENERATION_PROMPT.strip()}\n\n"
        f"Inquiry type (نوع استعلام): {service_label}\n"
        f"Raw data received (داده‌های دریافتی):\n{raw_result}"
    )

    generated_response = llm.complete(prompt, build_llm_messages(state))

    return generated_response


def inquiry_node(state: GraphState, llm) -> GraphState:
    selection = resolve_inquiry_api(state, llm)
    if not selection.is_resolved:
        logger.info(f"Inquiry type not resolved | reason={selection.reason}")
        state.selected_api = ""
        state.final_response = selection.clarification_question
        state.response = GraphResult(toolType=ResponseType.TEXT, text=selection.clarification_question)
        return state

    api_name = selection.api_name
    state.selected_api = api_name
    logger.info(f"Selected API: {api_name} | reason={selection.reason}")

    slot_result = fill_slots(state, llm, INQUIRY_CATEGORY, api_name)
    state.slot_result = slot_result

    if slot_result.is_complete:
        logger.info(f"Slots complete: {slot_result.slots}")
        slots_dic = {slot.name: slot.value for slot in slot_result.slots}
        raw_result = _call_inquiry_api(api_name, slots_dic)
        generated_response = _generate_inquiry_response(state, llm, api_name, raw_result)

        
        
        
        state.final_response = generated_response
        state.response = GraphResult(toolType=ResponseType.TEXT, text=generated_response)
    else:
        logger.debug(f"Missing slots: {slot_result.missing_slots}")
        state.final_response = slot_result.clarification_question
        state.response = GraphResult(toolType=ResponseType.TEXT, text=slot_result.clarification_question)

    return state
