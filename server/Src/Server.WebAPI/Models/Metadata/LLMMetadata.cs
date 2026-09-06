using MongoDB.Bson.Serialization.Attributes;
using Server.WebAPI.Models.Base;

namespace Server.WebAPI.Models.Metadata
{
	/// <summary>
	/// Stores raw LLM API call metadata for debugging and monitoring purposes.
	/// </summary>
	public class LLMMetadata : BaseEntity
	{
		[BsonElement("chatId")]
		public string? ChatId { get; set; }

		[BsonElement("prompt")]
		public string Prompt { get; set; } = string.Empty;

		[BsonElement("message")]
		public string? Messages { get; set; }


		[BsonElement("model")]
		public string Model { get; set; } = string.Empty;

		[BsonElement("rawResponse")]
		public string RawResponse { get; set; } = string.Empty;

		[BsonElement("responseContent")]
		public string? ResponseContent { get; set; }

		[BsonElement("promptTokens")]
		public int PromptTokens { get; set; }

		[BsonElement("completionTokens")]
		public int CompletionTokens { get; set; }

		[BsonElement("totalTokens")]
		public int TotalTokens { get; set; }

		[BsonElement("durationMs")]
		public long DurationMs { get; set; }

		[BsonElement("statusCode")]
		public int StatusCode { get; set; }

		[BsonElement("isSuccess")]
		public bool IsSuccess { get; set; }

		[BsonElement("errorMessage")]
		public string? ErrorMessage { get; set; }

		[BsonElement("traceId")]
		public string? TraceId { get; set; }

		[BsonElement("spanId")]
		public string? SpanId { get; set; }

		[BsonElement("parentSpanId")]
		public string? ParentSpanId { get; set; }

		[BsonElement("requestUrl")]
		public string? RequestUrl { get; set; }

		[BsonElement("temperature")]
		public double? Temperature { get; set; }

		[BsonElement("serviceTier")]
		public string? ServiceTier { get; set; }

		[BsonElement("systemFingerprint")]
		public string? SystemFingerprint { get; set; }

		[BsonElement("completionId")]
		public string? CompletionId { get; set; }

		[BsonElement("reasoningContent")]
		public string? ReasoningContent { get; set; }
	}
}
