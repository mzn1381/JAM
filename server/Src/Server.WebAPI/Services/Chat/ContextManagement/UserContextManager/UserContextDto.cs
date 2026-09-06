namespace Server.WebAPI.Services.Chat.ContextManagement.UserContextManager
{
	public class UserContextDto
	{
		public Dictionary<string, bool> PreferencesItems { get; set; } = new();
	}
}
