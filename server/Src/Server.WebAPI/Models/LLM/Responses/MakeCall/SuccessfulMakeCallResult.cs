using System.Text.Json.Serialization;

namespace Server.WebAPI.Models.LLM.Responses.MakeCall;

//{
//  "intent": "make_call",
//  "call": {
//    "contact": "",
//    "phoneNumber": "09123456789"
//  }
//}

//{
//"intent":"none",
//"message_to_user":"I can only help you make calls. Please provide a valid call request including phone number or contact name.",
//"source_text":"What is the capital of France?"
//}

//{
//  "intent": "make_call",
//  "missing": ["contact or phoneNumber"],
//  "message_to_user": "Who should I call? Please provide a contact name or phone number.",
//  "source_text": "Please make a call"
//}

public class SuccessfulMakeCallResult
{
	[JsonPropertyName("intent")]
	public string Intent { get; set; } = string.Empty;

	[JsonPropertyName("call")]
	public CallDetail Call { get; set; } = new();

	[JsonPropertyName("source_text")]
	public string SourceText { get; set; } = string.Empty;

	[JsonPropertyName("message_to_user")]
	public string MessageToUser { get; set; } = string.Empty;

	[JsonPropertyName("missing")]
	public List<string> Missing { get; set; } = new();
}

public class CallDetail
{
	[JsonPropertyName("phoneNumber")]
	public string PhoneNumber { get; set; } = string.Empty;

	[JsonPropertyName("contact")]
	public string Contact { get; set; } = string.Empty;
}
