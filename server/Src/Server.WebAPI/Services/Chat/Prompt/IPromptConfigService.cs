using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Config;

namespace Server.WebAPI.Services.Chat.Prompt
{
	public interface IPromptConfigService : ITransientService
	{
		string GetPromptConfig(string promptName);
		void SetPromptConfig(string promptName, string promptContent);
	}

	public class PromptConfigService : IPromptConfigService
	{
		private static string CacheKey = "PromptConfig";
		private readonly ServerSetting _serverSetting;
		private readonly IMemoryCache _memoryCache;
		public PromptConfigService(IOptionsMonitor<ServerSetting> optionsMonitor,
			IMemoryCache memoryCache)
		{
			_serverSetting = optionsMonitor.CurrentValue;
			_memoryCache = memoryCache;
		}
		public string GetPromptConfig(string promptName)
		{
			var promptContent = _memoryCache.Get($"{CacheKey}_{promptName}");
			if (promptContent == null)
			{
				//promptContent = GetPromptFromCofng(promptName);
				promptContent = GetPromptFromFile(promptName);

				_memoryCache.Set(CacheKey, promptContent);
			}

			return promptContent.ToString() ?? string.Empty;
		}

		private string GetPromptFromFile(string promptName)
		{
			var path = Path.Combine(Directory.GetCurrentDirectory(), "Prompts", promptName, "LLM_Prompts.txt");

			var promptContent = File.ReadAllText(path);

			if(string.IsNullOrEmpty(promptContent))
			{
				throw new Exception($"Error reading the prompt file ({path})");
			}

			return promptContent;
		}

		[Obsolete("Put prompts in files in folder Prompt")]
		private string GetPromptFromCofng(string promptName)
		{
			return promptName switch
			{
				// Add-Prompts-Place
				PromptsNames.Introduction => _serverSetting.Prompt.Introduction,
				PromptsNames.IntentDetector => _serverSetting.Prompt.IntentDetection,
				PromptsNames.SetAlarm => _serverSetting.Prompt.SetAlarm,
				PromptsNames.SetCalendar => _serverSetting.Prompt.SetCalendar,

				PromptsNames.ConsultingOnBuy => _serverSetting.Prompt.ConsultingOnBuy,
				PromptsNames.MakeCall => _serverSetting.Prompt.MakeCall,
				PromptsNames.SendSMS => _serverSetting.Prompt.SendSMS,
				PromptsNames.SendEmail => _serverSetting.Prompt.SendEmail,
				_ => string.Empty,
			};
		}

		public void SetPromptConfig(string promptName, string promptContent)
		{
			_memoryCache.Set($"{CacheKey}_{promptName}", promptContent);
		}
	}
}
