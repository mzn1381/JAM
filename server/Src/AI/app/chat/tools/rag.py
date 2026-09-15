import json
import os

import requests
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()


class ApiRagTools:
    BaseUrl = "http://172.16.1.81:8080" ## this should be refactor and reviewed
    api_key = "ragflow-ajFHmiBuMNqS4f4ZMPA_6v7OLvLrRyeP6IRd_TQgugw"
    HttpHeader = {
        "Content-Type": "application/json",
        "Authorization": os.getenv("API_DOT_IR_KEY", api_key),
    }

    
    
    @tool
    def get_api_sw1_call_rag(chat_id:str,conversation_id:str) -> str:
            """سرویس کال api در rag service """
            # data = {"user_name": user_name}
            response = requests.get(
                ApiRagTools.BaseUrl + "/api/v1/chats/"+chat_id+"/sessions/"+conversation_id,
                headers=ApiRagTools.HttpHeader,
                
            )
            if response.status_code == 200:
               return response.json()
            return f"Request failed with status code: {response.status_code}"
    
    
    
    @tool
    def post_api_sw1_call_rag(chat_id:str,conversation_id:str,messages) -> str:
            """سرویس کال API در RAG service"""
    
            data = {
            "chat_id": chat_id,
            "internet": False,
            "messages":messages,
            "pass_all_history_messages": True,
            "reasoning": 1,
            "stream":False,
            "session_id": conversation_id
        }
    
            response = requests.post(
            ApiRagTools.BaseUrl + "/api/v1/chat/completions",
            headers=ApiRagTools.HttpHeader,
            json=data,
        )
    
            print("post_api_sw1_ragflow =======> !!!!")
    
            if response.status_code == 200:
                    data=response.json(),
                    return data
    
            return (
            f"Request failed with status code: {response.status_code}\n"
            f"Response: {response.text}"
            )