using Microsoft.Extensions.Options;
using Server.WebAPI.Config;
using Server.WebAPI.Services.Chat.ContextManagement;
using Server.WebAPI.Services.NaturalLanguageGeneratore;
using Server.WebAPI.Services.OpenAPI;
using System.Text.Json;

namespace Server.WebAPI.Services.Chat.PolicyManagement
{
	public class PolicyManagementService : IPolicyManagementService
	{
		private readonly INaturalLanguageGeneratoreService _nlg;
		private readonly ServerSetting _serverSetting;

		private JsonSerializerOptions JsonSerializerOptions { get; } = new JsonSerializerOptions()
		{
			WriteIndented = true,
			// unicode support
			Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
		};

		public PolicyManagementService(INaturalLanguageGeneratoreService nlg, IOptionsMonitor<ServerSetting> optionsMonitor)
		{
			_nlg = nlg;
			_serverSetting = optionsMonitor.CurrentValue;
		}
		public async Task<List<AskToolsDto>> GetTools(ChatTaskDto chatTaskDto, OpenWebUISendPromptResponseDto openWebUISendPromptResponseDto, PishkarContext pishkarContext, CancellationToken cancellationToken = default)
		{
			var emptySlots = pishkarContext.ChatContext.ActiveTask.MissingSlots;
			// OR use pishkarContext.ChatContext.ActiveTask.Status == Models.Chat.Status.MissingInfo
			if(emptySlots.Count != 0)
			{
				(var missingInfoMessage, var rawMessage) = await GetMissingInfoMessage(pishkarContext);

				return await Task.FromResult(new List<AskToolsDto>()
				{
					new AskToolsDto()
					{
						ResponseMessage = missingInfoMessage,
						ToolName = PromptsNames.MessageToUser,
						Payload = new Dictionary<string, string>()
						{
							{ "message", rawMessage },
						},
					},
				});
			}

			return await Task.FromResult(new List<AskToolsDto>()
			{
				new AskToolsDto()
				{
					ResponseMessage = openWebUISendPromptResponseDto.ResponseMessage,
				},
			});
		}

		private async Task<(string, string)> GetMissingInfoMessage(PishkarContext pishkarContext)
		{
			if(_serverSetting.NaturalLanguageGenerator.Enable)
			{
				var nlgResult = await _nlg.GenerateMessage(new NaturalLanguageGeneratorInput()
				{
					PishkarContext = pishkarContext,
					NaturalLanguageGeneratorType = NaturalLanguageGeneratorType.missing_info,
				});

				var message = JsonSerializer.Serialize(new
				{
					intent = PromptsNames.MessageToUser,
					message = nlgResult.Message,
				}, JsonSerializerOptions);

				return (message, nlgResult.Message);
			}
			else
			{
				var emptySlots = pishkarContext.ChatContext.ActiveTask.MissingSlots;

				var missingSlots = emptySlots.Aggregate((s1, s2) => $"{s1},{s2}");

				var message = JsonSerializer.Serialize(new
				{
					intent = PromptsNames.MessageToUser,
					message = $"You got missing info {missingSlots}",
				});

				return (message, $"You got missing info {missingSlots}");
			}
		}
	}
}
