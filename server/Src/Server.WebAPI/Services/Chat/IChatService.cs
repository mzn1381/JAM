using Server.WebAPI.Common.DependencyInjection;
using System.Text.Json.Serialization;

namespace Server.WebAPI.Services.Chat
{
	public class AskInputDto
	{
		public string ChatId { get; set; } = string.Empty;
		public List<ChatTaskDto> Tasks { get; set; } = new List<ChatTaskDto>();
	}

	public class ChatTaskDto
	{
		public Guid ChatId { get; set; } // = Guid.NewGuid();

		[JsonPropertyName("message")]
		public string Message { get; set; } = string.Empty;

		[JsonPropertyName("intent")]
		public string? Intention { get; set; }

		[JsonPropertyName("confidence")]
		public float? Confidence { get; set; }

		[JsonPropertyName("user_language")]
		public string? UserLanguage { get; set; }
	}

	public class AskResultDto
	{
		public List<AskToolsDto> Tools { get; set; } = new();
		public int? TotalTokensUsed { get; set; }
		public long? TotalDurationMs { get; set; }
	}

	public class AskToolsDto
	{
		[Obsolete("Use ToolName and Payload instead.")]
		public string ResponseMessage { get; set; } = string.Empty;

		public string ToolName { get; set; } = string.Empty;
		public Dictionary<string, string> Payload { get; set; } = new();
	}

	public interface IChatService : ITransientService
	{
		Task<AskResultDto> AskAsync(AskInputDto input, CancellationToken cancellationToken = default);
	}
}
