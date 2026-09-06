using Server.WebAPI.Services.Chat.ExternalIntentDetector;
using Server.WebAPI.Services.Chat.Prompt;
using Server.WebAPI.Services.OpenAPI;
using System.Text.Json;

namespace Server.WebAPI.Services.NaturalLanguageGeneratore
{
	public class NaturalLanguageGeneratoreService : INaturalLanguageGeneratoreService
	{
		private readonly ILogger<NaturalLanguageGeneratoreService> _logger;
		private readonly IPromptBuilderService _promptBuilderService;
		private readonly IOpenWebUIService _openWebUIService;

		public NaturalLanguageGeneratoreService(IPromptBuilderService promptBuilderService,
			IOpenWebUIService openWebUIService,
			ILogger<NaturalLanguageGeneratoreService> logger)
		{
			_promptBuilderService = promptBuilderService;
			_openWebUIService = openWebUIService;
			_logger = logger;
		}

		public async Task<NaturalLanguageGeneratorResult> GenerateMessage(NaturalLanguageGeneratorInput input)
		{
			var promptResult = _promptBuilderService.GetLanguageGeneratorPrompt(input, input.PishkarContext);

			var result = await _openWebUIService.SendPromptAsync(new OpenWebUISendPromptRequestDto()
			{
				ChatId = string.Empty,
				ChatName = string.Empty,
				Prompt = promptResult.RawPrompt,
				Message = promptResult.Messages,
			});

			var naturalLanguageGeneratorResult = new NaturalLanguageGeneratorResult();

			try
			{
				var json = result.ResponseMessage.Trim();

				var getNLGResult = JsonSerializer.Deserialize<IntentDetectionDto>(json) ?? new IntentDetectionDto();

				naturalLanguageGeneratorResult.Message = getNLGResult.Message;
			}
			catch(Exception ex)
			{
				// TODO:
				_logger.LogError(ex, $"Can't parse the json returned for NLG module, ({result.ResponseMessage})");
			}

			return naturalLanguageGeneratorResult;
		}
	}
}
