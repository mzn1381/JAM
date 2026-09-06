using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.Chat;

namespace Server.WebAPI.Services.Chat.ContextManagement.ChatContextManager
{
	public interface IChatContextManager : IScopedService
	{
		Task<ChatContext> GetOrCreateContext(ChatTaskDto chatTaskDto, CancellationToken cancellationToken = default);
		Task<ChatContext> UpdateContext(ChatTaskDto chatTaskDto, string processorResult, PishkarContext pishkarContext, CancellationToken cancellationToken = default);
		Task UpdateChatContextIntent(ChatTaskDto task, PishkarContext pishkarContext, CancellationToken cancellationToken = default);
	}
}
