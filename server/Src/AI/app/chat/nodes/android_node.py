from app.chat.models.models import GraphState, GraphResult, ToolCallResult
from app.chat.utils.slot_filler import select_api, fill_slots
from app.chat.tools.android import AndroidTools
from app.chat.logger import get_logger
from app.chat.api.registry import ANDROID_CATEGORY

logger = get_logger("android")

_API_MAP = {
    "post_api_android_MakeCall": AndroidTools.post_api_android_MakeCall,
    "post_api_android_SetAlarm": AndroidTools.post_api_android_SetAlarm,
    "post_api_android_SendEmail": AndroidTools.post_api_android_SendEmail,
    "post_api_android_SendSMS": AndroidTools.post_api_android_SendSMS,
    "post_api_android_SetCalendar": AndroidTools.post_api_android_SetCalendar,
}

def _call_android_api(api_name: str, slots: dict) -> ToolCallResult:
    func = _API_MAP.get(api_name)

    if not func:
        logger.warning(f"API not found: {api_name}")
        return ToolCallResult(graph_result=None, message=f"متأسفانه سرویس '{api_name}' پیدا نشد.", success=False)
    try:
        logger.info(f"Calling {api_name} with slots: {slots}")
        return func.invoke(slots)
    
    except KeyError as e:
        logger.error(f"Missing field in {api_name}: {e}")
        return ToolCallResult(graph_result=None, message=f"اطلاعات ناقص است: {e}", success=False)
    
    except Exception as e:
        logger.error(f"Error in {api_name}: {e}")
        return ToolCallResult(graph_result=None, message=f"خطا در فراخوانی سرویس: {e}", success=False)

def android_node(state: GraphState, llm) -> GraphState:
    api_name = select_api(state, llm, ANDROID_CATEGORY)
    state.selected_api = api_name

    slot_result = fill_slots(state, llm, ANDROID_CATEGORY, api_name)
    state.slot_result = slot_result

    if slot_result.is_complete:
        slots_dic = {slot.name: slot.value for slot in slot_result.slots}
        tool_call_result = _call_android_api(api_name, slots_dic)

        state.final_response = tool_call_result.message
        state.response = tool_call_result.graph_result
    else:
        state.final_response = slot_result.clarification_question

    return state
