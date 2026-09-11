from pydantic import BaseModel, Field

from app.chat.models.models import GraphState, IntentResult, IntentCategory
from app.chat.api.registry import (
    CLASSIFIER_HINT,
    VALID_INTENT_NAMES,
    ACTION_NAVIGATOR_HINT,
    get_classifier_categories_with_examples,
)
from app.chat.utils.conversation import build_llm_messages
from app.chat.logger import get_logger
from app.chat.tools.action_flow import ApiFlowTools
from app.chat.models.models import GraphState, GraphResult, ResponseType, ToolCallResult



_API_MAP = {
    "post_api_sw1_call_flow": ApiFlowTools.post_api_sw1_call_flow,
    "get_api_sw1_get_flows": ApiFlowTools.get_api_sw1_get_flows,
}



logger = get_logger("intent_classifier")


class _IntentRouterStructuredOutput(BaseModel):
    flow_id: str = Field("123456", description="The selected flow Id")
    flow_name: str = Field("create", description="The selected flow name")
    confidence: float = Field(1.0, description="Confidence score from 0 to 1")
    reasoning: str = Field("", description="Short explanation in Persian")


def _format_category(cat: dict) -> str:
    lines = [f"- {cat['name']}: {cat['description']}"]
    if cat.get("examples"):
        examples = " | ".join(f"«{phrase}»" for phrase in cat["examples"])
        lines.append(f"  Examples: {examples}")
    return "\n".join(lines)


def _build_prompt(state: GraphState) -> str:
    categories_desc = "\n".join(
        _format_category(cat) for cat in get_classifier_categories_with_examples()
    )

    hint_section = f"\n{CLASSIFIER_HINT}\n" if CLASSIFIER_HINT else ""

    return f"""You are an intent classifier. Based on the conversation history (user and assistant messages), determine the user's intent.

Categories:
{categories_desc}
{hint_section}
Output JSON only, no extra text:
{{"category": "<name>", "confidence": <0-1>, "reasoning": "<short explanation in Persian (فارسی)>"}}"""





def _resolve_action(result: _IntentRouterStructuredOutput) -> tuple[str, float, str]:
    flow_name = result.flow_name
    flow_id = result.flow_id
    # if category not in VALID_INTENT_NAMES:
    #     logger.warning(f"Intent classifier returned invalid category: {category!r}")
    #     category = "chitchat"

    confidence = result.confidence
    try:
        confidence = float(confidence) if confidence is not None else 1.0
    except (TypeError, ValueError):
        confidence = 1.0

    return flow_name,flow_id,confidence,result.reasoning







def get_flow_categories(flows: list[dict]) -> list[dict]:
    """
    Normalize raw LangFlow flow objects into a minimal, prompt-ready shape.
    Only flows with a valid 'id' are kept; missing descriptions get a
    sensible Persian fallback so the LLM never sees an empty field.
    """
    return [
        {
            "id": flow["id"],
            "name": flow.get("name") or "بدون‌نام",
            "description": flow.get("description") or "توضیحی برای این فلو ثبت نشده است.",
        }
        for flow in flows
        if flow.get("id")
    ]

def _format_flow_category(flow: dict) -> str:
    lines = [f"- {flow['name']} (id: {flow['id']}): {flow['description']}"]
    return "\n".join(lines)




################
def _build_action_navigator_prompt(flows: list[dict]) -> str:
    """
    Builds the prompt for the action-navigator node: given the list of
    currently available LangFlow flows, asks the LLM to pick the single
    flow whose 'id' best matches the user's execution intent, and also
    return that flow's 'name' for downstream display/logging purposes.
    """
    flow_categories = get_flow_categories(flows)
    categories_desc = "\n".join(
        _format_flow_category(flow) for flow in flow_categories
    )
    # hint_section Should be refactored !!! #MGZ 
    hint_section = f"\n{ACTION_NAVIGATOR_HINT}\n" if ACTION_NAVIGATOR_HINT else ""

    return f"""You are an action router. Based on the conversation history (user and assistant messages), determine which ONE of the available flows below should be executed to fulfill the user's current request.

Available Flows:
{categories_desc}
{hint_section}
Rules:
- You MUST choose exactly one flow from the list above — never invent a new one.
- If no flow reasonably matches the user's request, return "flow_id": null, "flow_name": null and explain why in "reasoning".
- The "flow_name" MUST be the exact "name" corresponding to the returned "flow_id" — never mix them up or return a name whose id differs from "flow_id".

Output JSON only, no extra text:
{{"flow_id": "<id or null>", "flow_name": "<name or null>", "confidence": <0-1>, "reasoning": "<short explanation in Persian (فارسی)>"}}"""




def get_flows_by_folder(folder_id:str="") -> str:
    api_name = "get_api_sw1_get_flows" ### Should be refactored #MGZ
    func = _API_MAP.get(api_name)
    if not func:
        logger.warning(f"API not found: {api_name}")
        return f"سرویس '{api_name}' پیدا نشد."

    try:
        logger.info(f"Calling {api_name} with folder id: {id} ")
        return func.invoke(folder_id)
    except KeyError as e:
        logger.error(f"Missing field in {id}: {e}")
        return f"اطلاعات ناقص است: {e}"
    except Exception as e:
        logger.error(f"Error in {api_name}: {e}")
        return f"خطا در فراخوانی سرویس: {e}"


    


def call_flow(flowid: str,session_id:str,flow_name:str,message:str) -> str:
    api_name = "post_api_sw1_call_flow" ### Should be refactored #MGZ
    func = _API_MAP.get(api_name)
    if not func:
        logger.warning(f"API not found: {api_name}")
        return f"سرویس '{api_name}' پیدا نشد."

    try:
        data = {"flow_id":flowid,"message":message,"session_id":session_id}
        logger.info(f"Calling {api_name} with flow id: {id} and with flow name:{flow_name}")
        return func.invoke(data)
    except KeyError as e:
        logger.error(f"Missing field in {id}: {e}")
        return f"اطلاعات ناقص است: {e}"
    except Exception as e:
        logger.error(f"Error in {api_name}: {e}")
        return f"خطا در فراخوانی سرویس: {e}"



def action_navigator_node(state: GraphState, llm):
    
    flows = get_flows_by_folder()

    data = flows["items"]

    prompt = _build_action_navigator_prompt(data)

    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _IntentRouterStructuredOutput,
    )

    flow_name, flow_id, confidence, reasoning = _resolve_action(result)

    logger.info(
        f"flow_name: {flow_name}|"
        f"flow_id: {flow_id} | "
        f"confidence: {confidence} | "
        f"reasoning: {reasoning} | "
        f"input: '{state.user_input}'"
    )

    res = call_flow(
        flow_id,
        state.session_id,
        flow_name,
        state.user_input
    )

    text_res_flow = res["output"]["text"]

    response = GraphResult(
        toolType=ResponseType.TEXT,
        text=text_res_flow
    )

    return {
        "response": response,
        "final_response": text_res_flow,
    }




def action_navigator_node_o(state: GraphState, llm) -> GraphState:
    
    # Calling get api from lang flows to fetch all apis # MGZ 
    flows = get_flows_by_folder() #Should be refactored !!! #MGZ
    # flows = get_flows_docs() #Should be refactored !!! #MGZ
    data = flows['items']
    prompt = _build_action_navigator_prompt(data)
    result = llm.complete_structured_output(
        prompt,
        build_llm_messages(state),
        _IntentRouterStructuredOutput,
    )
    flow_name,flow_id,confidence,reasoning = _resolve_action(result)
    
    logger.info(
        f"flow_name: {flow_name}|flow_id: {flow_id} | confidence: {confidence} | "
        f"reasoning: {reasoning} | input: '{state.user_input}'"
    )
    # state.flow_selected = {"flow_name":flow_name,"flow_id":flow_id,"confidence":confidence,"reasoning":reasoning}

    res = call_flow(flow_id,state.session_id,flow_name,state.user_input)
    
    # state.raw_result_api = res
    
    # generated_response = _generate_inquiry_response(state, llm, api_name, raw_result)
    text_res_flow = res["output"]["text"]
    # state.final_response = res ### should llm generate final response
    state.response = GraphResult(toolType=ResponseType.TEXT, text=text_res_flow)
    state.final_response = GraphResult(toolType=ResponseType.TEXT, text=text_res_flow)

    
    # state.action = {IntentResult(
    #     category=IntentCategory(category),
    #     confidence=confidence,
    #     reasoning=reasoning,
    # )}


    return state
    
def get_flows_docs():
            #     response = requests.post(
        #     ApiIrTools.BaseUrl + "/api/sw1/RegisterUser",
        #     headers=ApiIrTools.HttpHeader,
        #     json=data,
        # )
        # return response
        return  [
  {
    "name": "Create User",
    "description": "Create user in Arad Cloud",
    "icon": "null",
    "icon_bg_color": "null",
    "gradient": "null",
    "is_component": False,
    "updated_at": "2026-08-29T11:30:26+00:00",
    "webhook": False,
    "endpoint_name": "null",
    "tags": [],
    "locked": False,
    "mcp_enabled": False,
    "action_name": "null",
    "action_description": "null",
    "access_type": "PRIVATE",
    "flow_type": "workflow",
    "a2a_enabled": False,
    "a2a_card_overrides": "null",
    "id": "4f2dae60-bc45-4f4e-aedd-3b3322c9d83f",
    "user_id": "e0e1088a-716f-4578-b444-33b53cfc2f15",
    "folder_id": "4a594c78-e585-437c-93f0-26b62a14f60c",
    "workspace_id": "null",
    "name_key": "null"
  },
  {
    "name": "Create VPS Purchase Invoice",
    "description": "Create a purchase invoice for a VPS order in Arad Cloud, including plan selection and pricing details",
    "icon": "null",
    "icon_bg_color": "null",
    "gradient": "null",
    "is_component": False,
    "updated_at": "2026-08-29T11:30:26+00:00",
    "webhook": False,
    "endpoint_name": "null",
    "tags": [],
    "locked": False,
    "mcp_enabled": False,
    "action_name": "null",
    "action_description": "null",
    "access_type": "PRIVATE",
    "flow_type": "workflow",
    "a2a_enabled": False,
    "a2a_card_overrides": "null",
    "id": "8b1e4a12-2f6d-4c9a-9e3b-7a5c1d8f6b2e",
    "user_id": "e0e1088a-716f-4578-b444-33b53cfc2f15",
    "folder_id": "4a594c78-e585-437c-93f0-26b62a14f60c",
    "workspace_id": "null",
    "name_key": "null"
  },
  {
    "name": "Purchase VPS With Invoice Number",
    "description": "Purchase a VPS by referencing an existing invoice number and provisioning the server accordingly",
    "icon": "null",
    "icon_bg_color": "null",
    "gradient": "null",
    "is_component": False,
    "updated_at": "2026-08-29T11:30:26+00:00",
    "webhook": False,
    "endpoint_name": "null",
    "tags": [],
    "locked": False,
    "mcp_enabled": False,
    "action_name": "null",
    "action_description": "null",
    "access_type": "PRIVATE",
    "flow_type": "workflow",
    "a2a_enabled": False,
    "a2a_card_overrides": "null",
    "id": "c3d9f647-5e1a-4b8c-8a2d-6f4b9c0e1a7d",
    "user_id": "e0e1088a-716f-4578-b444-33b53cfc2f15",
    "folder_id": "4a594c78-e585-437c-93f0-26b62a14f60c",
    "workspace_id": "null",
    "name_key": "null"
  },
  {
    "name": "Check VPS Invoice Status",
    "description": "Check the payment and processing status of a VPS purchase invoice using its invoice number",
    "icon": "null",
    "icon_bg_color": "null",
    "gradient": "null",
    "is_component": False,
    "updated_at": "2026-08-29T11:30:26+00:00",
    "webhook": False,
    "endpoint_name": "null",
    "tags": [],
    "locked": False,
    "mcp_enabled": False,
    "action_name": "null",
    "action_description": "null",
    "access_type": "PRIVATE",
    "flow_type": "workflow",
    "a2a_enabled": False,
    "a2a_card_overrides": "null",
    "id": "f6a2b8d3-9c7e-4f1a-b5d6-3e8a1c9f2b4e",
    "user_id": "e0e1088a-716f-4578-b444-33b53cfc2f15",
    "folder_id": "4a594c78-e585-437c-93f0-26b62a14f60c",
    "workspace_id": "null",
    "name_key": "null"
  }
]


