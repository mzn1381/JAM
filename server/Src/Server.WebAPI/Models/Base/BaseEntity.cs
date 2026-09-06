using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Server.WebAPI.Models.Base
{
	public class BaseEntity<T>
	{
		[BsonId]
		public T Id { get; set; } = default!;

		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
		public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

		public bool IsDeleted { get; set; } = false;
		public DateTime? DeletedAt { get; set; }
	}

	public class BaseEntity : BaseEntity<Guid>
	{
	}
}
