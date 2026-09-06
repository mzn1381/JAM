from pydantic import BaseModel, Field

from app.chat.models.models import GraphState, SlotFillerResult, SlotFillerLLMStructuredOutput
from app.chat.utils.conversation import build_llm_messages
from app.chat.llm_client import LLMClient


class _APISelectionStructuredOutput(BaseModel):
    api_name: str = Field("", description="The name of the selected API")


def _has_slot_value(value) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, dict, set, tuple)):
        return len(value) > 0
    return True


def _enforce_required_slots_only(
    result: SlotFillerLLMStructuredOutput,
    api,
) -> SlotFillerLLMStructuredOutput:
    required_names = {name for name, slot in api.slots.items() if slot.required}
    filled_names = {
        slot.name for slot in result.slots
        if slot.name in api.slots and _has_slot_value(slot.value)
    }
    missing_required = sorted(required_names - filled_names)

    return SlotFillerLLMStructuredOutput(
        slots=[slot for slot in result.slots if slot.name in api.slots and _has_slot_value(slot.value)],
        missing_slots=missing_required,
        is_complete=not missing_required,
        clarification_question=result.clarification_question if missing_required else "",
    )


def select_api(state: GraphState, llm: LLMClient, category) -> str:
    apis = category.apis

    if len(apis) == 1:
        return apis[0].name

    api_list = "\n".join([
        f"- {api.name}: {api.description}\n  Examples (نمونه): {', '.join(api.example_phrases[:2])}"
        for api in apis
    ])

    prompt = f"""
Based on the conversation history, select the most appropriate API.

{api_list}

Output JSON:
{{"api_name": "<name>"}}
"""

    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _APISelectionStructuredOutput,
    )
    api_names = {api.name for api in apis}
    return result.api_name if result.api_name in api_names else apis[0].name


def fill_slots(state: GraphState, llm: LLMClient, category, api_name: str) -> SlotFillerResult:
    api = next((item for item in category.apis if item.name == api_name), None)

    if not api:
        return SlotFillerResult(
            api_name=api_name,
            slots=[],
            is_complete=False,
            missing_slots=[],
            clarification_question="سرویس مورد نظر پیدا نشد."
        )

    required_slots = {name: slot for name, slot in api.slots.items() if slot.required}
    optional_slots = {name: slot for name, slot in api.slots.items() if not slot.required}

    def _format_slot_lines(slots: dict[str, object]) -> str:
        return "\n".join(
            f"- {name}: {slot.description}"
            for name, slot in slots.items()
        ) or "- (none)"

    required_desc = _format_slot_lines(required_slots)
    optional_desc = _format_slot_lines(optional_slots)

    prompt = f"""
For API '{api_name}', extract slot values from the conversation history.

Required slots (الزامی — must be filled; missing any of these means is_complete=false):
{required_desc}

Optional slots (اختیاری — fill only if the user provided them; never ask for these and never put them in missing_slots):
{optional_desc}

{category.extra_prompt_hints}

Completion rules:
- is_complete=true only when every required slot has a value.
- is_complete=false only when at least one required slot is missing.
- Optional slots must NOT block completion: if an optional slot is missing, leave it out of slots/missing_slots and still set is_complete=true when all required slots are present.
- missing_slots must contain ONLY required slot names that are still missing.
- Ask clarification_question in Persian (فارسی) only for missing required slots.

Output JSON:
{{
  "slots": [{{"name": "slot_name", "value": "slot_value"}}],
  "missing_slots": ["required_slot_name_only"],
  "is_complete": true/false,
  "clarification_question": "<Persian question if a required slot is missing, otherwise empty>"
}}
"""

    result = llm.complete_slotfiller_structured(prompt, build_llm_messages(state))
    result = _enforce_required_slots_only(result, api)

    return SlotFillerResult(
        api_name=api_name,
        slots=result.slots,
        missing_slots=result.missing_slots,
        is_complete=result.is_complete,
        clarification_question=result.clarification_question
    )
