

namespace Server.WebAPI.Services.OpenAPI
{
	public class OpenWebUISendPromptRequestDto
	{
		public string? ChatId { get; set; }

		[Obsolete("Use Message Property")]
		public string Prompt { get; set; } = string.Empty;
		public string? ChatName { get; set; }

		// Optional parameters for future use
		public List<(string, string)> Message { get; set; } = new();
	}

	public class OpenWebUISendPromptResponseDto
	{
		public ChatCompletionResponse ChatResponse { get; set; } = new();

		public string ResponseMessage { get; set; } = string.Empty;
		public string ResolvedChatId { get; set; } = string.Empty;

		public int? TokensUsed { get; set; }
		public long? DurationMs { get; set; }
	}
}
