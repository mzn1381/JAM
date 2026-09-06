using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Services.Chat.ContextManagement;
using Server.WebAPI.Services.Chat.Prompt;
using Server.WebAPI.Services.OpenAPI;
using System.Text.Json.Serialization;

namespace Server.WebAPI.Services.Chat.ExternalIntentDetector
{
	public interface IExternalIntentDetector : ITransientService
	{
		Task<ChatTaskDto> GetIntention(ChatTaskDto chat, PishkarContext pishkarContext);
	}

	public class ExternalIntentDetector : IExternalIntentDetector
	{
		private readonly IPromptBuilderService _promptBuilderService;
		private readonly IOpenWebUIService _openWebUIService;
		private readonly ILogger<ExternalIntentDetector> _logger;

		public ExternalIntentDetector(IPromptBuilderService promptBuilderService,
			IOpenWebUIService openWebUIService,
			ILogger<ExternalIntentDetector> logger)
		{
			_promptBuilderService = promptBuilderService;
			_openWebUIService = openWebUIService;
			_logger = logger;
		}
		public async Task<ChatTaskDto> GetIntention(ChatTaskDto chat, PishkarContext pishkarContext)
		{
			var promptResult = _promptBuilderService.GetIntentDetectionPrompt(chat, pishkarContext);

			var result = await _openWebUIService.SendPromptAsync(new OpenWebUISendPromptRequestDto()
			{
				ChatId = string.Empty,
				ChatName = string.Empty,
				Prompt = promptResult.RawPrompt,
				Message = promptResult.Messages,
			});

			var intentResult = new ChatTaskDto();

			try
			{
				var json = result.ResponseMessage.Trim();

				//var firstBraceIndex = josn.IndexOf('{');
				//if(firstBraceIndex >= 0)
				//{
				//	josn = josn.Substring(firstBraceIndex);
				//}

				//var lastBraceIndex = josn.LastIndexOf('}');
				//if(lastBraceIndex >= 0)
				//{
				//	josn = josn.Substring(0, lastBraceIndex + 1);
				//}

				var getIntentResult = System.Text.Json.JsonSerializer.Deserialize<IntentDetectionDto>(json) ?? new IntentDetectionDto();

				intentResult.Intention = getIntentResult.Intention;
				intentResult.UserLanguage = getIntentResult.UserLanguage;
			}
			catch(Exception ex)
			{
				// TODO:
				_logger.LogError(ex, $"Can't parse the json returned for ExternalIntentDetector module, ({result.ResponseMessage})");
			}

			return intentResult;
		}
	}

	// TODO
	public class IntentDetectionDto
	{
		[JsonPropertyName("message")]
		public string Message { get; set; } = string.Empty;

		[JsonPropertyName("intent")]
		public string? Intention { get; set; }

		[JsonPropertyName("confidence")]
		public float? Confidence { get; set; }

		[JsonPropertyName("user_language")]
		public string? UserLanguage { get; set; }
	}
}
