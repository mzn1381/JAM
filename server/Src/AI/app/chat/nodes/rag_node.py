from app.chat.models.models import GraphState
from app.chat.tools.rag import ApiRagTools
from app.chat.logger import get_logger
from app.chat.models.models import GraphState, GraphResult, ResponseType, ToolCallResult

logger = get_logger("inquiry")

_API_MAP = {
    "post_api_sw1_RegisterUser": ApiRagTools.post_api_sw1_call_rag,
}

_INQUIRY_GENERATION_PROMPT = """

"""



def rag_node(state: GraphState, llm) -> GraphState:
        #     response = requests.post(
        #     ApiIrTools.BaseUrl + "/api/sw1/RegisterUser",
        #     headers=ApiIrTools.HttpHeader,
        #     json=data,
        # )
        
    rag_api_name = "post_api_sw1_RegisterUser"
    func = _API_MAP[rag_api_name]    
    res = func.invoke(state.user_input)
    
    #  filling state's essentials    
      
    state.final_response =res
    state.response = GraphResult(toolType=ResponseType.TEXT, text=res)
   
    #    
    print("THERE ARE NO ARAD'S APIS  !!!!")
    return state
