using Server.WebAPI.Services.Chat.ContextManagement.ChatContextManager;
using Server.WebAPI.Services.Chat.ContextManagement.UserContextManager;

namespace Server.WebAPI.Services.Chat.ContextManagement
{
	public interface IPishkarContextManager
	{
		public IUserContextManager UserContextManager { get; }
		public IChatContextManager ChatContextManager { get; }
	}

	public class PishkarContextManager : IPishkarContextManager
	{
		private readonly IUserContextManager _userContextManager;
		private readonly IChatContextManager _chatContextManager;

		public PishkarContextManager(IUserContextManager userContextManager, IChatContextManager chatContextManager)
		{
			_userContextManager= userContextManager;
			_chatContextManager = chatContextManager;
		}
		public IUserContextManager UserContextManager => _userContextManager;

		public IChatContextManager ChatContextManager => _chatContextManager;
	}
}
