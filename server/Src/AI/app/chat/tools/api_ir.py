import json
import os

import requests
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()


class ApiIrTools:
    BaseUrl = "https://s.api.ir"
    HttpHeader = {
        "Content-Type": "application/json",
        "Authorization": os.getenv("API_DOT_IR_KEY", ""),
    }

    @tool
    def post_api_sw1_PostalTracking(trackingCode: str) -> str:
        """سرویس رهیگیری بسته پستی"""
        data = {"trackingCode": trackingCode}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/PostalTracking",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_ChequeInfo(chequeID: str) -> str:
        """استعلام مشخصات چک صیادی"""
        data = {"chequeID": chequeID}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/ChequeInfo",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_VehicleViolation(
        nationalCode: str,
        mobile: str,
        plateNumber: str,
    ) -> str:
        """وب سرویس استعلام خلافی خودرو"""
        data = {
            "nationalCode": nationalCode,
            "mobile": mobile,
            "plateNumber": plateNumber,
        }
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/VehicleViolation",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_ActivePlates(nationalCode: str, mobile: str) -> str:
        """استعلام پلاک های فعال"""
        data = {"nationalCode": nationalCode, "mobile": mobile}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/ActivePlates",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_WatterBill(billID: str) -> str:
        """وب سرویس قبض آب"""
        data = {"billID": billID}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/WatterBill",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_PowerBill(billID: str) -> str:
        """وب سرویس قبض برق"""
        data = {"billID": billID}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/PowerBill",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"

    @tool
    def post_api_sw1_GasBill(billID: str) -> str:
        """وب سرویس قبض گاز"""
        data = {"billID": billID}
        response = requests.post(
            ApiIrTools.BaseUrl + "/api/sw1/GasBill",
            headers=ApiIrTools.HttpHeader,
            json=data,
        )
        if response.status_code == 200:
            return "OK\n\n" + json.dumps(response.json(), indent=2, ensure_ascii=False)
        return f"Request failed with status code: {response.status_code}"
