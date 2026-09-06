using Microsoft.Extensions.Options;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Metadata;
using Server.WebAPI.Services.Chat.ContextManagement;
using Server.WebAPI.Services.Chat.ContextManagement.ChatContextManager;
using Server.WebAPI.Services.Chat.ExternalIntentDetector;
using Server.WebAPI.Services.Chat.IntetDetector;
using Server.WebAPI.Services.Chat.PolicyManagement;
using Server.WebAPI.Services.Chat.Prompt;
using Server.WebAPI.Services.MetaData;
using Server.WebAPI.Services.OpenAPI;
using System.Diagnostics;
using System.Text.Json;

namespace Server.WebAPI.Services.Chat
{
	public class ChatService : IChatService
	{
		private readonly IPromptBuilderService _promptService;
		private readonly IOpenWebUIService _openWebUIService;
		private readonly IChatMetaDataService _metaDataService;
		private readonly IInternalIntentDetector _internalIntetDetector;
		private readonly IExternalIntentDetector _externalIntentDetector;
		private readonly IChatContextManager _chatContextManager;
		private readonly IPolicyManagementService _policyManagementService;
		private readonly ILogger<ChatService> _logger;
		private readonly ServerSetting _serverSetting;

		public ChatService(IPromptBuilderService promptService,
			IOpenWebUIService openWebUIService,
			IChatMetaDataService metaDataService,
			IInternalIntentDetector internalIntetDetector,
			IExternalIntentDetector externalIntentDetector,
			IChatContextManager chatContextManager,
			IPolicyManagementService policyManagementService,
			ILogger<ChatService> logger,
			IOptionsMonitor<ServerSetting> optionsMonitor)
		{
			_promptService = promptService;
			_openWebUIService = openWebUIService;
			_logger = logger;
			_metaDataService = metaDataService;
			_internalIntetDetector = internalIntetDetector;
			_externalIntentDetector = externalIntentDetector;
			_chatContextManager = chatContextManager;
			_policyManagementService = policyManagementService;
			_serverSetting = optionsMonitor.CurrentValue;
		}
		public async Task<AskResultDto> AskAsync(AskInputDto input, CancellationToken cancellationToken = default)
		{
			List<AskToolsDto> responseTools = new();
			int totalTokensUsed = 0;
			long totalDurationMs = 0;
			string? resolvedChatId = string.IsNullOrWhiteSpace(input.ChatId) ? null : input.ChatId;

			foreach(var task in input.Tasks)
			{
				var pishkarContext = new PishkarContext();

				// Input Validation
				bool isValid = ValidateTaskInput(responseTools, task);
				if(isValid == false)
				{
					continue;
				}

				//TODO: harder check on chatid
				if(task.ChatId == Guid.Empty)
				{
					task.ChatId = Guid.Parse(input.ChatId);
				}

				var chatContext = await _chatContextManager.GetOrCreateContext(task);
				pishkarContext.ChatContext = chatContext;

				var differentIntentFromCurrentActive = await DetectIntent(task, pishkarContext, cancellationToken);

				if(string.IsNullOrWhiteSpace(task.Intention) || task.Intention == PromptsNames.None)
				{
					// TODO: improve message
					responseTools.Add(new AskToolsDto()
					{
						ResponseMessage = JsonSerializer.Serialize(new
						{
							intent = PromptsNames.MessageToUser,
							message = "Sorry but Pishkar can't help you",
						}),
					});
					continue;
				}

				if(differentIntentFromCurrentActive)
				{
					// TODO: improve message
					responseTools.Add(new AskToolsDto()
					{
						ResponseMessage = JsonSerializer.Serialize(new
						{
							intent = PromptsNames.MessageToUser,
							message = "Sorry, but you already have unfinished tasks. Please finish them before starting a new one.",
						}),
					});
					continue;
				}

				await _chatContextManager.UpdateChatContextIntent(task, pishkarContext);

				var promptResult = _promptService.GetSlotExtractorPrompt(new ChatTaskDto()
				{
					Intention = task.Intention,
					Message = task.Message,
					Confidence = task.Confidence,
				}, pishkarContext, cancellationToken);

				var response = await _openWebUIService.SendPromptAsync(new OpenWebUISendPromptRequestDto()
				{
					ChatId = resolvedChatId,
					ChatName = null,
					Prompt = promptResult.RawPrompt,
					Message = promptResult.Messages,
				}, cancellationToken);

				// chat state update
				var updatedChatContext = await _chatContextManager.UpdateContext(task, response.ResponseMessage, pishkarContext);
				pishkarContext.ChatContext = updatedChatContext;

				// chat policy management
				var tools = await _policyManagementService.GetTools(task, response, pishkarContext, cancellationToken);

				responseTools.AddRange(tools);

				// TODO: accumulate tokens and duration if available
				totalTokensUsed += response.TokensUsed ?? 0;
				totalDurationMs += response.DurationMs ?? 0;

				await LogResult(resolvedChatId, task, promptResult, response, pishkarContext, responseTools, cancellationToken);
			}

			var result = new AskResultDto()
			{
				Tools = responseTools,
				TotalTokensUsed = totalTokensUsed,
				TotalDurationMs = totalDurationMs,
			};

			return result;
		}

		private static bool ValidateTaskInput(List<AskToolsDto> responseTools, ChatTaskDto task)
		{
			if(task == null)
			{
				responseTools.Add(new AskToolsDto()
				{
					ResponseMessage = JsonSerializer.Serialize(new
					{
						intent = PromptsNames.MessageToUser,
						message = "Invalid task item.",
					}),
				});
				return false;
			}

			if(PromptsNames.IsValidPrompt(task.Intention!) == false)
			{
				responseTools.Add(new AskToolsDto()
				{
					ResponseMessage = JsonSerializer.Serialize(new
					{
						intent = PromptsNames.MessageToUser,
						message = $"Invalid intent: {task.Intention}",
					}),
				});
				return false;
			}

			return true;
		}


		private async Task<bool> DetectIntent(ChatTaskDto task, PishkarContext pishkarContext, CancellationToken cancellationToken)
		{
			// Internal intent detection
			if(_serverSetting.IntentDetector.Enable && string.IsNullOrEmpty(task.Intention))
			{
				var intentResults = _internalIntetDetector.DetectIntentAsync(task.Message, cancellationToken);

				if(intentResults != null)
				{
					task.Intention = intentResults.Intent;
					task.Confidence = intentResults.Confidence;
				}
			}

			// External intent detection
			if(string.IsNullOrWhiteSpace(task.Intention) || task.Intention == PromptsNames.None)
			{
				var getIntentionResult = await _externalIntentDetector.GetIntention(task, pishkarContext);

				//TODO: improve
				// new intent while active intent in chat
				if(pishkarContext.ChatContext.ActiveTask.Intent != PromptsNames.None
					&& pishkarContext.ChatContext.ActiveTask.Intent != getIntentionResult.Intention)
				{
					return false;
				}

				if(!string.IsNullOrWhiteSpace(getIntentionResult.Intention))
				{
					task.Intention = getIntentionResult.Intention;
					task.UserLanguage = getIntentionResult.UserLanguage;
					return false;
				}
			}

			if(task.Intention == pishkarContext.ChatContext.ActiveTask.Intent)
				return false;

			return true;
		}

		private async Task LogResult(string? resolvedChatId, ChatTaskDto item, GetPromptResult prompt, OpenWebUISendPromptResponseDto response, PishkarContext pishkarContext, List<AskToolsDto> responseTools, CancellationToken cancellationToken)
		{
			if(!string.IsNullOrWhiteSpace(resolvedChatId))
			{
				// Capture current activity trace information
				var currentActivity = Activity.Current;

				var metadata = new ChatMetadata
				{
					Input = item.Message,
					Prompt = prompt.RawPrompt,
					Messages = JsonSerializer.Serialize(prompt.Messages, new JsonSerializerOptions { WriteIndented = true }),
					UpdatedAt = DateTime.UtcNow,
					Response = response.ResponseMessage,
					ResponseTools = JsonSerializer.Serialize(responseTools),
					Context = JsonSerializer.Serialize(pishkarContext),
					ConversationId = resolvedChatId,
					Model = string.Empty,
					TokensUsed = response.TokensUsed ?? 0,
					DurationMs = response.DurationMs ?? 0,
					TraceId = currentActivity?.TraceId.ToString(),
				};

				await _metaDataService.UpsertAsync(metadata, cancellationToken);

				_logger.LogInformation(
					"Chat metadata logged. ConversationId: {ConversationId}, TraceId: {TraceId}, Intent: {Intent}",
					resolvedChatId, metadata.TraceId, item.Intention);
			}
		}
	}
}
