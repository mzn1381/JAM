using MongoDB.Bson.Serialization.Attributes;
using Server.WebAPI.Models.Base;

namespace Server.WebAPI.Models.SystemLogs
{
	public class ExceptionLog : BaseEntity
	{
		[BsonElement("message")]
		public string Message { get; set; } = string.Empty;

		[BsonElement("stackTrace")]
		public string? StackTrace { get; set; }

		[BsonElement("source")]
		public string? Source { get; set; }

		[BsonElement("exceptionType")]
		public string ExceptionType { get; set; } = string.Empty;

		[BsonElement("innerException")]
		public string? InnerException { get; set; }

		[BsonElement("requestPath")]
		public string? RequestPath { get; set; }

		[BsonElement("requestMethod")]
		public string? RequestMethod { get; set; }

		[BsonElement("queryString")]
		public string? QueryString { get; set; }

		[BsonElement("requestBody")]
		public string? RequestBody { get; set; }

		[BsonElement("userId")]
		public string? UserId { get; set; }

		[BsonElement("ipAddress")]
		public string? IpAddress { get; set; }

		[BsonElement("userAgent")]
		public string? UserAgent { get; set; }

		[BsonElement("traceId")]
		public string? TraceId { get; set; }

		[BsonElement("spanId")]
		public string? SpanId { get; set; }

		[BsonElement("parentSpanId")]
		public string? ParentSpanId { get; set; }

		[BsonElement("additionalData")]
		public Dictionary<string, object>? AdditionalData { get; set; }
	}
}
