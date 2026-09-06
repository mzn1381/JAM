using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Services.Chat.ContextManagement;
using Server.WebAPI.Services.OpenAPI;

namespace Server.WebAPI.Services.Chat.PolicyManagement
{
	public interface IPolicyManagementService : ITransientService
	{
		public Task<List<AskToolsDto>> GetTools(ChatTaskDto chatTaskDto, OpenWebUISendPromptResponseDto openWebUISendPromptResponseDto, PishkarContext pishkarContext, CancellationToken cancellationToken = default);
	}
}
