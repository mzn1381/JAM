using System.Text.Json.Serialization;

namespace Server.WebAPI.Models.LLM.Responses.SetCalendar;

//	{
//  "intent": "set_calendar",
//  "calendar": {
//    "title": "Meeting",
//    "date": "2024-01-15",
//    "hour": 10,
//    "minutes": 30
//  },
//  "source_text": "???? ?? ?????? ????? ???? ???? ???? ??:?? ?? ????? ???? ????? ??"
//}

//{
//  "intent": "set_calendar",
//  "event": {
//    "title": "جلسه",
//    "description": "",
//    "startDate": "2025-12-19T07:00:00.000Z",
//    "endDate": "2025-12-19T08:00:00.000Z",
//    "allDay": false,
//    "location": "",
//    "timezone": "Asia/Tehran",
//    "calendarId": "primary",
//    "alarms": []
//  }
//}

//{
//"intent":"none",
//"message_to_user":"I can only help you create calendar events. Please provide a valid calendar event request including title, date and time.",
//"source_text":"What is the capital of France?"
//}

//{
//  "intent": "set_calendar",
//  "missing": ["title", "date", "hour", "minutes"],
//  "message_to_user": "????? ?????? ????? ? ???? ?????? ????? ??? ?? ???? ????.",
//  "source_text": "???? ?? ?????? ????? ????? ??"
//}

public class SuccessfulSetCalendarResult
{
	[JsonPropertyName("intent")]
	public string Intent { get; set; } = string.Empty;

	[JsonPropertyName("event")]
	public CalendarDetail Event { get; set; } = new();

	[JsonPropertyName("source_text")]
	public string SourceText { get; set; } = string.Empty;

	[JsonPropertyName("message_to_user")]
	public string MessageToUser { get; set; } = string.Empty;

	[JsonPropertyName("missing")]
	public List<string> Missing { get; set; } = new();
}

//"event": {
//    "title": "Marketing Sync",
//    "date": "2026-02-20",
//    "start": "14:00",
//    "end": null,
//    "location": null,
//    "attendees": [],
//    "recurrence": null,
//    "notes": null
//  }

public class CalendarDetail
{
	[JsonPropertyName("title")]
	public string Title { get; set; } = string.Empty;

	[JsonPropertyName("date")]
	public string Date { get; set; } = string.Empty;

	[JsonPropertyName("start")]
	public string Start { get; set; } = string.Empty;

	[JsonPropertyName("end")]
	public string? End { get; set; }

	[JsonPropertyName("location")]
	public string? Location { get; set; }

	[JsonPropertyName("attendees")]
	public List<string>? Attendees { get; set; }

	[JsonPropertyName("recurrence")]
	public string? Recurrence { get; set; }

	[JsonPropertyName("notes")]
	public string? Notes { get; set; }
}
