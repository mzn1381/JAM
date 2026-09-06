using System.Text.Json.Serialization;

namespace Server.WebAPI.Models.LLM.Responses.SendEmail;

//{
//  "email": "ali@example.com",
//  "subject": "Meeting Tomorrow",
//  "body": "We will start at 10 am",
//  "cc": "",
//  "bcc": ""
//}

//{
//  "intent": "send_email",
//  "missing": ["email", "subject", "body"],
//  "message_to_user": "Who should I send the email to, what is the subject, and what should the message say?",
//  "source_text": "Send a birthday greeting to mom"
//}

//{
//  "intent": "send_email",
//  "missing": ["to", "subject", "body"],
//  "message_to_user": "????? ???? ????? ??????? ????? ? ??? ????? ?? ???? ????.",
//  "source_text": "???? ????? ?????"
//}

public class SuccessfulSendEmailResult
{
	[JsonPropertyName("intent")]
	public string Intent { get; set; } = string.Empty;

	[JsonPropertyName("email")]
	public string Email { get; set; } = string.Empty;

	[JsonPropertyName("subject")]
	public string Subject { get; set; } = string.Empty;

	[JsonPropertyName("body")]
	public string Body { get; set; } = string.Empty;

	[JsonPropertyName("cc")]
	public string? Cc { get; set; }

	[JsonPropertyName("bcc")]
	public string? Bcc { get; set; }

	[JsonPropertyName("source_text")]
	public string SourceText { get; set; } = string.Empty;

	[JsonPropertyName("message_to_user")]
	public string MessageToUser { get; set; } = string.Empty;

	[JsonPropertyName("missing")]
	public List<string> Missing { get; set; } = new();
}

//public class EmailDetail
//{
//	[JsonPropertyName("to")]
//	public string To { get; set; } = string.Empty;

//	[JsonPropertyName("subject")]
//	public string Subject { get; set; } = string.Empty;

//	[JsonPropertyName("body")]
//	public string Body { get; set; } = string.Empty;
//}
