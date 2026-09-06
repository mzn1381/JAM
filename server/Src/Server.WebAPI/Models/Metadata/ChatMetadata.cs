using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using Server.WebAPI.Models.Base;
using System.Collections.Generic;

namespace Server.WebAPI.Models.Metadata
{
	public class ChatMetadata : BaseEntity
	{
		[BsonElement("conversationId")]
		public string ConversationId { get; set; } = string.Empty;

		[BsonElement("title")]
		public string? Title { get; set; }

		[BsonElement("input")]
		public string? Input { get; set; }

		[BsonElement("prompt")]
		public string Prompt { get; set; } = string.Empty;

		[BsonElement("messages")]
		public string? Messages { get; set; }

		[BsonElement("model")]
		public string? Model { get; set; }

		[BsonElement("context")]
		public string? Context { get; set; }

		[BsonElement("response")]
		public string Response { get; set; } = string.Empty;

		[BsonElement("responseTools")]
		public string? ResponseTools { get; set; }

		[BsonElement("tokensUsed")]
		public int? TokensUsed { get; set; }

		[BsonElement("durationMs")]
		public long? DurationMs { get; set; }

		[BsonElement("traceId")]
		public string? TraceId { get; set; }

		[BsonElement("participants")]
		public string[]? Participants { get; set; }

		[BsonElement("tags")]
		public string[]? Tags { get; set; }

		[BsonElement("data")]
		public Dictionary<string, object>? Data { get; set; }
	}
}
