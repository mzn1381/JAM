from app.chat.models.models import GraphState, GraphResult, ResponseType, ToolCallResult
from app.chat.api.registry import APPOINTMENT_CATEGORY
from app.chat.utils.slot_filler import select_api, fill_slots
from app.chat.tools.paziresh24 import Paziresh24Tools
from app.chat.logger import get_logger

logger = get_logger("appointment")

_API_MAP = {
    "paziresh24_SearchDoctor": Paziresh24Tools.paziresh24_SearchDoctor,
    "paziresh24_GetDoctorProfile": Paziresh24Tools.paziresh24_GetDoctorProfile,
}


def _call_appointment_api(api_name: str, slots: dict) -> ToolCallResult:
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
        logger.exception(f"Error in {api_name}")
        return ToolCallResult(graph_result=None, message=f"خطا در فراخوانی سرویس جستجوی دکتر: {e}", success=False)


def _describe_slots(slots: dict) -> str:
    parts: list[str] = []

    if slots.get("city"):
        parts.append(f"شهر {slots['city']}")
    if slots.get("query"):
        parts.append(f"جستجو: {slots['query']}")
    if slots.get("sort_by"):
        parts.append(f"مرتب‌سازی: {slots['sort_by']}")
    if slots.get("freeturn"):
        parts.append(f"زمان نوبت: {slots['freeturn']}")
    if slots.get("turn_type"):
        turn_label = "حضوری" if slots["turn_type"] == "non-consult" else "آنلاین"
        parts.append(f"نوع ویزیت: {turn_label}")

    return "، ".join(parts) if parts else "بدون فیلتر اضافه"


def appointment_node(state: GraphState, llm) -> GraphState:
    state.emit_progress("درخواست نوبت پزشکی شما را بررسی می‌کنم...", step="start")
    api_name = select_api(state, llm, APPOINTMENT_CATEGORY)
    state.selected_api = api_name
    logger.info(f"Selected API: {api_name}")
    state.emit_progress("سرویس جستجوی پزشک در پذیرش۲۴ انتخاب شد.", step="api_select")

    slot_result = fill_slots(state, llm, APPOINTMENT_CATEGORY, api_name)
    state.slot_result = slot_result
    logger.debug(
        f"Slot fill result | complete={slot_result.is_complete} | "
        f"slots={slot_result.slots} | missing={slot_result.missing_slots}"
    )

    if slot_result.is_complete:
        slots_dic = {slot.name: slot.value for slot in slot_result.slots}
        slot_summary = _describe_slots(slots_dic)
        logger.info(f"Slots complete: {slot_result.slots}")
        state.emit_progress(
            f"اطلاعات لازم جمع‌آوری شد ({slot_summary}).",
            step="slots_complete",
        )
        state.emit_progress("در حال جستجو در پذیرش۲۴...", step="api_call")
        tool_call_result = _call_appointment_api(api_name, slots_dic)
        state.final_response = tool_call_result.message
        state.response = tool_call_result.graph_result
        logger.info(f"API response length: {len(state.final_response or '')} chars")
    else:
        logger.info(f"Missing slots: {slot_result.missing_slots}")
        state.emit_progress(
            f"برای ادامه به این اطلاعات نیاز دارم: {', '.join(slot_result.missing_slots)}",
            step="slots_incomplete",
        )
        state.final_response = slot_result.clarification_question
        state.response = GraphResult(toolType=ResponseType.TEXT, text=slot_result.clarification_question)

    return state


def get_doctor_profile(slug: str, state: GraphState) -> GraphState:
    state.emit_progress("در حال دریافت پروفایل پزشک از پذیرش۲۴...", step="api_call")
    tool_call_result = _call_appointment_api(
        "paziresh24_GetDoctorProfile",
        {"doctor_id": slug},
    )
    state.final_response = tool_call_result.message
    state.response = tool_call_result.graph_result
    logger.info(f"Doctor profile response length: {len(state.final_response or '')} chars")
    return state
