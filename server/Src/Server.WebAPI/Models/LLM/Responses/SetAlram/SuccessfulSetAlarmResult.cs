using System.Text.Json.Serialization;

namespace Server.WebAPI.Models.LLM.Responses.SetAlram;

//	{
//  "intent": "set_alarm",
//  "alarm": {
//    "hour": 7,
//    "minutes": 0
//  },
//  "source_text": "لطفا یک آلارم برای فردا صبح ساعت ۷ تنظیم کن"
//}

//{
//"intent":"none",
//"message_to_user":"I can only help you set alarms. Please provide a valid alarm request including time.",
//"source_text":"What is the capital of France?"
//}

//{
//  "intent": "set_alarm",
//  "missing": ["hour", "minutes"],
//  "message_to_user": "لطفاً زمان (ساعت و دقیقه) آلارم خود را مشخص کنید.",
//  "source_text": "لطفا یک آلارم برای فردا صبح تنظیم کن"
//}

public class SuccessfulSetAlarmResult
{
	[JsonPropertyName("intent")]
	public string Intent { get; set; } = string.Empty;
	[JsonPropertyName("alarm")]
	public AlarmDetail Alarm { get; set; } = new();
	[JsonPropertyName("source_text")]
	public string SourceText { get; set; } = string.Empty;

	[JsonPropertyName("message_to_user")]
	public string MessageToUser { get; set; } = string.Empty;

	[JsonPropertyName("missing")]
	public List<string> Missing { get; set; } = new();
}

public class AlarmDetail
{
	[JsonPropertyName("hour")]
	public int? Hour { get; set; }
	[JsonPropertyName("minutes")]
	public int? Minutes { get; set; }
}
