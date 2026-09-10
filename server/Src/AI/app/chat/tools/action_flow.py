import json
import os
import json
import requests
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()


class ApiFlowTools:
    BaseUrl = "http://172.16.1.81" ## this should be refactor and reviewed
    HttpHeader = {
        "Content-Type": "application/json",
        "x-api-key": "sk-DH_flD8gwsMkawfmoGEMnd3t4a-1b-gs67LcUvjjres" # Should Be refactored #MGZ 
    }


    @tool
    def post_api_sw1_call_flow(flow_id: str, message: str, session_id: str) -> str:
        """سرویس کال workflow در Langflow"""

        data = {
        "flow_id": flow_id,
        "input_value": message,
        "session_id": session_id,
    }




        response = requests.post(
        ApiFlowTools.BaseUrl + "/api/v2/workflows",
        headers=ApiFlowTools.HttpHeader,
        json=data,
    )

        if response.status_code == 200:
            data = response.json()
            return data
        #     return "OK\n\n" + json.dumps(
        #     response.json(),
        #     indent=2,
        #     ensure_ascii=False
        # )

        return f"Request failed with status code: {response.status_code}"

    @tool
    def get_api_sw1_get_flows(folderId:str="") -> str:
            
            """دریافت تمام Flow های موجود داخل سازمان"""
            # 4a594c78-e585-437c-93f0-26b62a14f60c == > #MGZ ==> Project Id for each organ == > ARAD
            folderId="4a594c78-e585-437c-93f0-26b62a14f60c"
            flow_type = "workflow"
            response = requests.get(
                ApiFlowTools.BaseUrl + "/api/v1/flows/",
                headers=ApiFlowTools.HttpHeader,
            params={
        "remove_example_flows": True,
        "get_all": False,
        "folder_id": folderId,
        "flow_type": flow_type,
        "page": 1,## SHOULD BE REFACTORED # MGZ 
        "size": 100, ## SHOULD BE REFACTORED # MGZ 
        "x-api-key":"sk-DH_flD8gwsMkawfmoGEMnd3t4a-1b-gs67LcUvjjres" # Should Be refactored #MGZ 
    },
)

            if response.status_code == 200:
                data = response.json()
                # return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
                return data
            return f"Request failed with status code: {response.status_code}"
            