using Server.WebAPI.Common.DependencyInjection;

namespace Server.WebAPI.Services.Chat.ContextManagement.UserContextManager
{
	public interface IUserContextManager : ITransientService
	{
		Task CreateUserExplainer(UserContextDto input, Guid userId, CancellationToken cancellationToken = default);
	}
}
