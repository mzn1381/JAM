from app.chat.models.models import GraphState
from app.chat.tools.arad import ApiAradTools
from app.chat.logger import get_logger

logger = get_logger("inquiry")

_API_MAP = {
    "post_api_sw1_RegisterUser": ApiAradTools.post_api_sw1_RegisterUser,
}

_INQUIRY_GENERATION_PROMPT = """

"""



def register_user_node(state: GraphState, llm) -> GraphState:
        #     response = requests.post(
        #     ApiIrTools.BaseUrl + "/api/sw1/RegisterUser",
        #     headers=ApiIrTools.HttpHeader,
        #     json=data,
        # )
    print("THERE ARE NO ARAD'S APIS  !!!!")
    return " NOOOOOOOOOO !!!!"
