using Microsoft.Extensions.Options;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Services.Chat.ContextManagement;
using Server.WebAPI.Services.Chat.ContextManagement.UserContextManager;
using Server.WebAPI.Services.NaturalLanguageGeneratore;
using System.Text.Json;

namespace Server.WebAPI.Services.Chat.Prompt
{
	public class GetPromptResult
	{
		public string RawPrompt { get; set; } = string.Empty;

		public List<(string role, string content)> Messages { get; set; } = new();
	}

	public interface IPromptBuilderService : ITransientService
	{
		GetPromptResult GetSlotExtractorPrompt(ChatTaskDto chat, PishkarContext pishkarContext, CancellationToken cancellationToken = default);
		GetPromptResult GetUserExplainerPrompt(UserContextDto userContext);
		GetPromptResult GetIntentDetectionPrompt(ChatTaskDto chat, PishkarContext pishkarContext);
		GetPromptResult GetLanguageGeneratorPrompt(NaturalLanguageGeneratorInput chat, PishkarContext pishkarContext);
	}

	public class PromptBuilderService : IPromptBuilderService
	{
		private readonly IPromptConfigService _promptConfigService;

		private JsonSerializerOptions JsonSerializerOptions { get; } = new JsonSerializerOptions()
		{
			WriteIndented = true,
			// unicode support
			Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
		};

		public PromptBuilderService(IPromptConfigService promptConfigService)
		{
			_promptConfigService = promptConfigService;
		}

		public GetPromptResult GetIntentDetectionPrompt(ChatTaskDto chat, PishkarContext pishkarContext)
		{
			var systemPrompt = _promptConfigService.GetPromptConfig(PromptsNames.IntentDetector);

			// {
			//	  "context": {
			//		"user_context": {
			//		  "explanation": "A natural language summary of the user's long-term preferences, habits, and other relevant information. For example: 'This user often sets early morning alarms for the gym.' Use this for semantic disambiguation."
			//		},
			//		"chat_context": {
			//		  "active_task": {
			//			"intent": "set_alarm",
			//			"missingSlots": ["list", "of", "strings"],
			//			"payLoad": {
			//				"object": "containing currently known alarm fields"
			//			},
			//			"status": "InProgress|....."
			//		  }
			//		}
			//	  },
			//	  "user_message": "string"
			//}

			var userPromptJson = new
			{
				context = new
				{
					user_context = new
					{
						explanation = pishkarContext.UserContext.UserExplanation,
					},
					chat_context = new
					{
						active_task = new
						{
							intent = pishkarContext.ChatContext.ActiveTask?.Intent.ToString(),
							missingSlots = pishkarContext.ChatContext.ActiveTask?.PrintMissingSlots(),
							payLoad = JsonSerializer.Serialize(pishkarContext.ChatContext.Payload, JsonSerializerOptions),
							status = pishkarContext.ChatContext.ActiveTask?.Status.ToString(),
						},
					},
				},
				user_message = chat.Message,
			};

			var userPrompt = JsonSerializer.Serialize(userPromptJson, JsonSerializerOptions);

			var rawPrompt = systemPrompt + Environment.NewLine + userPromptJson;

			var message = new List<(string role, string content)>
			{
				(role: "system", content: systemPrompt),
				(role: "user", content: userPrompt),
			};

			return new GetPromptResult
			{
				RawPrompt = rawPrompt,
				Messages = message,
			};
		}

		public GetPromptResult GetLanguageGeneratorPrompt(NaturalLanguageGeneratorInput input, PishkarContext pishkarContext)
		{
			var systemPrompt = _promptConfigService.GetPromptConfig(PromptsNames.NaturalLanguageGenerator);

			var userPromptJson = new
			{
				type = input.NaturalLanguageGeneratorType.ToString(),
				language = pishkarContext.ChatContext.ActiveTask.UserLanguage,
				payload = new
				{
					intent = pishkarContext.ChatContext.ActiveTask?.Intent.ToString(),
					missingSlots = pishkarContext.ChatContext.ActiveTask?.PrintMissingSlots(),
					provided_fields = JsonSerializer.Serialize(pishkarContext.ChatContext.Payload, JsonSerializerOptions),
				}
			};

			var userPrompt = JsonSerializer.Serialize(userPromptJson, JsonSerializerOptions);

			var rawPrompt = systemPrompt + Environment.NewLine + userPrompt;

			var message = new List<(string role, string content)>
			{
				(role: "system", content: systemPrompt),
				(role: "user", content: userPrompt),
			};

			return new GetPromptResult
			{
				RawPrompt = rawPrompt,
				Messages = message,
			};
		}

		public GetPromptResult GetSlotExtractorPrompt(ChatTaskDto chat, PishkarContext pishkarContext, CancellationToken cancellationToken = default)
		{
			var systemPrompt = string.Empty;

			//systemPrompt += _promptConfigService.GetPromptConfig(PromptsNames.Introduction) + "\n\n";

			var intentionPrompt = chat.Intention switch
			{
				// Add-Prompts-Place
				PromptsNames.SetAlarm => _promptConfigService.GetPromptConfig(PromptsNames.SetAlarm),
				PromptsNames.SetCalendar => _promptConfigService.GetPromptConfig(PromptsNames.SetCalendar),
				PromptsNames.ConsultingOnBuy => _promptConfigService.GetPromptConfig(PromptsNames.ConsultingOnBuy),
				PromptsNames.SendEmail => _promptConfigService.GetPromptConfig(PromptsNames.SendEmail),
				PromptsNames.MakeCall => _promptConfigService.GetPromptConfig(PromptsNames.MakeCall),
				PromptsNames.SendSMS => _promptConfigService.GetPromptConfig(PromptsNames.SendSMS),
				_ => throw new InvalidOperationException($"Invalid intention for prompt building ({chat.Intention}).")
			};

			systemPrompt += Environment.NewLine + intentionPrompt;

			var userPromptJson = new
			{
				context = new
				{
					user_context = new
					{
						explanation = pishkarContext.UserContext.UserExplanation,
					},
					chat_context = new
					{
						active_task = new
						{
							intent = pishkarContext.ChatContext.ActiveTask?.Intent.ToString(),
							missingSlots = pishkarContext.ChatContext.ActiveTask?.PrintMissingSlots(),
							payLoad = JsonSerializer.Serialize(pishkarContext.ChatContext.Payload, JsonSerializerOptions),
							status = pishkarContext.ChatContext.ActiveTask?.Status.ToString(),
						},
					},
				},
				user_message = chat.Message,
			};

			var userPrompt = JsonSerializer.Serialize(userPromptJson, JsonSerializerOptions);

			var rawPrompt = systemPrompt + Environment.NewLine + userPromptJson;

			var message = new List<(string role, string content)>
			{
				(role: "system", content: systemPrompt),
				(role: "user", content: userPrompt),
			};

			return new GetPromptResult
			{
				RawPrompt = rawPrompt,
				Messages = message,
			};
		}

		public GetPromptResult GetUserExplainerPrompt(UserContextDto userContext)
		{
			var systemPrompt = _promptConfigService.GetPromptConfig(PromptsNames.Explainer);

			var userPrompt = "User Preferences:" + Environment.NewLine;

			userPrompt += JsonSerializer.Serialize(userContext.PreferencesItems, JsonSerializerOptions);

			var rawPrompt = systemPrompt + Environment.NewLine + userPrompt;

			var message = new List<(string role, string content)>
			{
				(role: "system", content: systemPrompt),
				(role: "user", content: userPrompt),
			};

			return new GetPromptResult
			{
				RawPrompt = rawPrompt,
				Messages = message,
			};
		}
	}
}
