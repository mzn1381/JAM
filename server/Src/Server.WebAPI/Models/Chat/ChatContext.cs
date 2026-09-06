using MongoDB.Bson.Serialization.Attributes;
using Server.WebAPI.Models.Base;
using Server.WebAPI.Services.Chat;

namespace Server.WebAPI.Models.Chat
{
	public class ChatContext : BaseEntity
	{
		public Guid ChatId { get; set; }
		public ActiveTask ActiveTask { get; set; } = new();
		public Dictionary<string, string?> Payload { get; set; } = new();
	}

	public class ActiveTask
	{
		//TODO
		public string Intent { get; set; } = PromptsNames.None;

		public string? UserLanguage { get; set; }

		public List<string> MissingSlots { get; set; } = new();

		//public List<string> FilledSlots { get; set; } = new();

		public Status Status { get; set; } = Status.InProgress;

		public string PrintMissingSlots()
		{
			if(MissingSlots.Count == 0)
			{
				return "[]";
			}

			return $"[{MissingSlots.Aggregate((s1, s2) => $"\"{s1}\", \"{s2}\"")}]";
		}
	}
}
