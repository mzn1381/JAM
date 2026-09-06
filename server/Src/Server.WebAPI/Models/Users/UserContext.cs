using Server.WebAPI.Models.Base;

namespace Server.WebAPI.Models.Users
{
	public class UserContext : BaseEntity
	{
		public Guid UserId { get; set; }

		public string UserExplanation { get; set; } = string.Empty;
	}
}
