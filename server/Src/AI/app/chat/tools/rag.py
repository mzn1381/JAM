import json
import os

import requests
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()


class ApiRagTools:
    BaseUrl = "https://rag.dte.ir/swagger" ## this should be refactor and reviewed
    HttpHeader = {
        "Content-Type": "application/json",
        "Authorization": os.getenv("API_DOT_IR_KEY", ""),
    }

    @tool
    def post_api_sw1_call_rag(input) -> str:
        """سرویس کال api در rag service """
        # data = {"user_name": user_name}
        # response = requests.post(
        #     ApiAradTools.BaseUrl + "/api/sw1/post_api_sw1_",
        #     headers=ApiAradTools.HttpHeader,
        #     json=data,
        # )
        # if response.status_code == 200:
        #     return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        # return f"Request failed with status code: {response.status_code}"
        print ("post_api_sw1_ragflow=======> !!!! ")
        return " Hi there ! "