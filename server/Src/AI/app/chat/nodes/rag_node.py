from app.chat.models.models import GraphState
from app.chat.tools.rag import ApiRagTools
from app.chat.logger import get_logger
import uuid
from app.chat.models.models import GraphState, GraphResult, ResponseType, ToolCallResult

logger = get_logger("inquiry")

_API_MAP = {
    "post_api_sw1_call_rag": ApiRagTools.post_api_sw1_call_rag,
    "get_api_sw1_call_rag": ApiRagTools.get_api_sw1_call_rag,
}

_RAG_GENERATION_PROMPT = """

"""



def rag_node(state: GraphState, llm) -> GraphState:
        #     response = requests.post(
        #     ApiIrTools.BaseUrl + "/api/sw1/RegisterUser",
        #     headers=ApiIrTools.HttpHeader,
        #     json=data,
        # )
       
    chat_id = "49debb20aec811f181c1cd529abfa6e1" # Should be refactored #MGZ     
    conversation_id = "c1616fc0aec911f181c1cd529abfa6e1" # Should be refactored #MGZ     
    rag_api_name_get = "get_api_sw1_call_rag"
    func = _API_MAP[rag_api_name_get]    
    data_get_rag = {"chat_id":chat_id,"conversation_id":conversation_id}
    history = func.invoke(data_get_rag)
    messages:list = history["data"]["messages"]
    
    messages.append({
      "content":state.user_input,
      "conversationId":conversation_id,
      "files":[],
      "id":str(uuid.uuid4()),
      "role":"user"
      
        
    })
    
    
    
    data_chat_rag={"chat_id":chat_id,"conversation_id":conversation_id,"messages":messages}
    rag_api_name_post = "post_api_sw1_call_rag"
    func = _API_MAP[rag_api_name_post] 
    response=func.invoke(data_chat_rag)
    ### We are assuming that we are not using streaming right now  == > Should be refactored MGZ
    res = response[0]["data"] 
    
    
    
    ({'code': 0, 'data': {...}, 'message': 'success'},)
    {'answer': 'فردوسی انسانی پرتلاش، صبور و دارای اراده\u200cای قوی بود که زندگی خود را وقف سرودن شاهنامه کرد. او فردی متواضع و بسیار علاقه\u200cمند به حفظ زبان و فرهنگ ایرانی بود و با عشق و انگیزه قوی، بدون حمایت مالی کافی، این اثر عظیم را خلق کرد. او نمادی از وفاداری به هویت ملی و فرهنگی ایران است.', 'audio_binary': None, 'chat_id': '49debb20aec811f181c1cd529abfa6e1', 'created_at': 1789237505.9542406, 'id': 'c50dc5df-a22f-4e38-bab1-dddc04705a74', 'prompt': '', 'reference': {}, 'session_id': 'c1616fc0aec911f181c1cd529abfa6e1'}
    
    
    #  filling state's essentials    
      
    # state.final_response =res
    # state.response_mgz = GraphResult(toolType=ResponseType.TEXT, text='dddddd')
    # state.response = GraphResult(toolType=ResponseType.TEXT, text=res)
    return {
        "response": res["answer"],
        "final_response": res["answer"],
    }
    #    
    print("THERE ARE NO ARAD'S APIS  !!!!")
    return state
