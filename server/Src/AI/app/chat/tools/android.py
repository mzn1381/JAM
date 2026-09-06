import json
from typing import Optional

from langchain_core.tools import tool

from app.chat.models.models import OnDeviceResponse, ResponseType, GraphResult, ToolCallResult


class AndroidTools:

    # post_api_android_MakeCall
# {
#   "intent": "make_call",
#   "call":{
#   "contact": "Sarah",
#   "phoneNumber": "555-0199"
#   }
# }
    @tool
    def post_api_android_MakeCall(contact: Optional[str] = None, phoneNumber: Optional[str] = None) -> ToolCallResult:
        '''Simulates making a call by returning a JSON string with the contact and phone number.
         - contact: The name of the contact to call.
         - phoneNumber: The phone number to call.
        '''
        data = {
            "intent": "make_call",
            "call": {
                "contact": contact,
                "phoneNumber": phoneNumber
            }
        }

        invocation_json = json.dumps(data, indent=2, ensure_ascii=False)

        onDevicePayload = OnDeviceResponse(invocationJson=invocation_json)
        tool_result = GraphResult(toolType=ResponseType.ON_DEVICE, ondevicePayload=onDevicePayload)

        return ToolCallResult(graph_result=tool_result, message=invocation_json, success=True)
     
#    post_api_android_SetAlarm
#         {
#   "intent": "set_alarm",
#   "alarm": {
#     "hour": 7,
#     "minutes": 30,
#     "message": "Workout",
#     "days": [1, 2, 3, 4, 5],
#     "vibrate": true,
#     "ringtone": "",
#     "skipUI": false,
#   }
# }

    @tool
    def post_api_android_SetAlarm(hour: int, minutes: int, message: Optional[str] = None, days: Optional[list] = None) -> ToolCallResult:
        '''Simulates setting an alarm by returning a JSON string with the alarm details.
         - hour: The hour for the alarm (0-23).
         - minutes: The minutes for the alarm (0-59).
         - message: An optional message for the alarm.
         - days: An optional list of integers representing the days of the week (1-7) for the alarm to repeat on.
        '''
        data = {
            "intent": "set_alarm",
            "alarm": {
                "hour": hour,
                "minutes": minutes,
                "message": message,
                "days": days
            }
        }

        invocation_json = json.dumps(data, indent=2, ensure_ascii=False)

        onDevicePayload = OnDeviceResponse(invocationJson=invocation_json)
        tool_result = GraphResult(toolType=ResponseType.ON_DEVICE, ondevicePayload=onDevicePayload)
        
        return ToolCallResult(graph_result=tool_result, message=invocation_json, success=True)

    # post_api_android_SendEmail
#     {
#   "intent": "send_email",
#   "email": "boss@company.com",
#   "subject": "Weekly Report",
#   "body": "Here is the report.",
#   "cc": null,
#   "bcc": null
# }

    @tool
    def post_api_android_SendEmail(email: str, subject: str, body: str, cc: Optional[str] = None, bcc: Optional[str] = None) -> ToolCallResult:
        '''Simulates sending an email by returning a JSON string with the email details.
         - email: The recipient's email address.
         - subject: The subject of the email.
         - body: The body of the email.
         - cc: An optional email address to CC.
         - bcc: An optional email address to BCC.
        '''
        data = {
            "intent": "send_email",
            "email": email,
            "subject": subject,
            "body": body,
            "cc": cc,
            "bcc": bcc
        }

        invocation_json = json.dumps(data, indent=2, ensure_ascii=False)

        onDevicePayload = OnDeviceResponse(invocationJson=invocation_json)
        tool_result = GraphResult(toolType=ResponseType.ON_DEVICE, ondevicePayload=onDevicePayload)

        return ToolCallResult(graph_result=tool_result, message=invocation_json, success=True)

#post_api_android_SendSMS
# {
#   "intent": "send_sms",
#   "contactName": "Mom",
#   "phoneNumber": null,
#   "message": "I will be home for dinner"
# }
    
    @tool
    def post_api_android_SendSMS(contactName: str, message: str, phoneNumber: Optional[str] = None) -> ToolCallResult:
        '''Simulates sending an SMS by returning a JSON string with the SMS details.
         - contactName: The name of the contact to send the SMS to.
         - message: The message to send.
         - phoneNumber: An optional phone number to send the SMS to (if contactName is not available).
        '''
        data = {
            "intent": "send_sms",
            "contactName": contactName,
            "phoneNumber": phoneNumber,
            "message": message
        }

        invocation_json = json.dumps(data, indent=2, ensure_ascii=False)

        onDevicePayload = OnDeviceResponse(invocationJson=invocation_json)
        tool_result = GraphResult(toolType=ResponseType.ON_DEVICE, ondevicePayload=onDevicePayload)

        return ToolCallResult(graph_result=tool_result, message=invocation_json, success=True)

    # post_api_android_SetCalendar
# {
#   "intent": "set_calendar",
    # "event": {
    #   {
    #     title: "physical therapy practice";
    #     description?: string;
    #     startDate: ISODateString;//"2026-06-12"
    #     endDate?: ISODateString; //"2026-09-12"
    #     allDay?: boolean;
    #     location?: string;
    #     timezone?: string;
    #     calendarId?: string;
    #     recurrenceRule?: IncomingRecurrenceRule;
    #     alarms?: IncomingAlarm[];
    #   }
    # }
# }

    @tool
    def post_api_android_SetCalendar(title: str, startDate: str, description: Optional[str] = None, endDate: Optional[str] = None) -> ToolCallResult:
        '''Simulates setting a calendar event by returning a JSON string with the event details.
         - title: The title of the calendar event.
         - startDate: The start date of the event in ISO format (YYYY-MM-DD).
         - description: An optional description of the event.
         - endDate: An optional end date of the event in ISO format (YYYY-MM-DD).
        '''
        data = {
            "intent": "set_calendar",
            "event": {
                "title": title,
                "description": description,
                "startDate": startDate,
                "endDate": endDate
            }
        }

        invocation_json = json.dumps(data, indent=2, ensure_ascii=False)

        onDevicePayload = OnDeviceResponse(invocationJson=invocation_json)
        tool_result = GraphResult(toolType=ResponseType.ON_DEVICE, ondevicePayload=onDevicePayload)

        return ToolCallResult(graph_result=tool_result, message=invocation_json, success=True)
    
    tools = [
        post_api_android_MakeCall,
        post_api_android_SetAlarm,
        post_api_android_SendEmail,
        post_api_android_SendSMS,
        post_api_android_SetCalendar,
    ]
