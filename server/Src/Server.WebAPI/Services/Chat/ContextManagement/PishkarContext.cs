using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Chat.ContextManagement.ChatContextManager;

namespace Server.WebAPI.Services.Chat.ContextManagement
{
	public class PishkarContext
	{
		public UserContext UserContext { get; set; } = new();
		public ChatContext ChatContext { get; set; } = new();
	}
}
