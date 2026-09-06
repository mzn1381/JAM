namespace Server.WebAPI.Services.Chat.IntetDetector
{
	public class InternalIntentResultDto
	{
		public string Intent { get; set; } = string.Empty;
		public string Message { get; set; } = string.Empty;
		public float Confidence { get; set; }
	}
}
