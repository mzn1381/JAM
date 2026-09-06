using System.Text.Json.Serialization;

namespace Server.WebAPI.Models.LLM.Responses.SendSMS;

//{
//"intent": "send_sms",
//"contactName": "Ali",
//"message": "Hello!",
//"phoneNumber": ""
//}

//{
//"intent": "none",
//"message_to_user": "Request is not for sending SMS",
//"source_text": "<original user request>"
//}

//{
//"intent": "send_sms",
//"missing": ["message", "contactName_or_phoneNumber"],
//"message_to_user": "Please provide a message and either a contact name or a phone number.",
//"source_text": "Send a message"
//}

public class SuccessfulSendSMSResult
{
	[JsonPropertyName("intent")]
	public string Intent { get; set; } = string.Empty;

	[JsonPropertyName("message")]
	public string Message { get; set; } = string.Empty;

	[JsonPropertyName("phoneNumber")]
	public string PhoneNumber { get; set; } = string.Empty;
	
	[JsonPropertyName("contactName")]
	public string ContactName { get; set; } = string.Empty;

	[JsonPropertyName("source_text")]
	public string SourceText { get; set; } = string.Empty;

	[JsonPropertyName("message_to_user")]
	public string MessageToUser { get; set; } = string.Empty;

	[JsonPropertyName("missing")]
	public List<string> Missing { get; set; } = new();
}

//public class SMSDetail
//{
//	[JsonPropertyName("phone_number")]
//	public string PhoneNumber { get; set; } = string.Empty;

//	[JsonPropertyName("message")]
//	public string Message { get; set; } = string.Empty;
//}
