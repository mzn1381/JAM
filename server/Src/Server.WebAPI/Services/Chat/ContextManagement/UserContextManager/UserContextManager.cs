using Microsoft.EntityFrameworkCore;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Chat.Prompt;
using Server.WebAPI.Services.OpenAPI;
using System.Text.Json;

namespace Server.WebAPI.Services.Chat.ContextManagement.UserContextManager
{
	public class UserContextManager : IUserContextManager
	{
		private readonly ServerDbContext _serverDbContext;
		private readonly IPromptBuilderService _promptBuilderService;
		private readonly IOpenWebUIService _openWebUIService;

		public UserContextManager(ServerDbContext serverDbContext,
			IPromptBuilderService promptBuilderService,
			IOpenWebUIService openWebUIService)
		{
			_serverDbContext = serverDbContext;
			_promptBuilderService = promptBuilderService;
			_openWebUIService = openWebUIService;
		}
		public async Task CreateUserExplainer(UserContextDto input, Guid userId, CancellationToken cancellationToken = default)
		{
			var promptResult = _promptBuilderService.GetUserExplainerPrompt(input);

			var llmResult = await _openWebUIService.SendPromptAsync(new OpenWebUISendPromptRequestDto()
			{
				ChatName = "User Explainer",
				ChatId = null,
				Prompt = promptResult.RawPrompt,
				Message = promptResult.Messages,
			}, cancellationToken);

			var explanation = llmResult.ResponseMessage;

			if(string.IsNullOrEmpty(explanation))
			{
				throw new Exception($"LLM did not return any explanation. UserId: {userId}, PromptName: {PromptsNames.Explainer}, ChatName: User Explainer.");
			}

			var userContext = await _serverDbContext.UserContexts.FirstOrDefaultAsync(uc => uc.UserId == userId, cancellationToken);

			if (userContext == null)
			{
				userContext = new UserContext
				{
					UserId = userId,
					UserExplanation = explanation,
				};
				_serverDbContext.UserContexts.Add(userContext);
			}
			else
			{
				userContext.UserExplanation = explanation;
				_serverDbContext.UserContexts.Update(userContext);
			}

			await _serverDbContext.SaveChangesAsync(cancellationToken);
		}
	}
}
