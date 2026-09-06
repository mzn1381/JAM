using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Config;

namespace Server.WebAPI.Services.Chat.Regex
{
	public interface IRegexService : ITransientService
	{
		List<System.Text.RegularExpressions.Regex> GetRegexConfig(string RegexName);
		void SetRegexConfig(string RegexName, List<string> RegexContent);
	}

	public class RegexService : IRegexService
	{
		private static string CacheKey = "RegexConfig";
		private readonly ServerSetting _serverSetting;
		private readonly IMemoryCache _memoryCache;
		public RegexService(IOptionsMonitor<ServerSetting> optionsMonitor,
			IMemoryCache memoryCache)
		{
			_serverSetting = optionsMonitor.CurrentValue;
			_memoryCache = memoryCache;
		}
		public List<System.Text.RegularExpressions.Regex> GetRegexConfig(string regexName)
		{
			var regexContent = _memoryCache.Get<List<System.Text.RegularExpressions.Regex>>($"{CacheKey}_{regexName}");
			if(regexContent == null)
			{
				//regexContent = GetRegexFromConfig(regexName);
				regexContent = GetRegexFromFile(regexName);

				_memoryCache.Set($"{CacheKey}_{regexName}", regexContent);
			}
			return regexContent ?? new List<System.Text.RegularExpressions.Regex>();
		}

		[Obsolete("Put regexes in files in folder Prompt")]
		private List<System.Text.RegularExpressions.Regex> GetRegexFromConfig(string regexName)
		{
			return regexName switch
			{
				PromptsNames.SetAlarm => _serverSetting.IntentDetector.SetAlarm.Select(x => new System.Text.RegularExpressions.Regex(x)).ToList(),
				PromptsNames.SetCalendar => _serverSetting.IntentDetector.SetCalendar.Select(x => new System.Text.RegularExpressions.Regex(x)).ToList(),
				_ => [],
			};
		}

		private List<System.Text.RegularExpressions.Regex> GetRegexFromFile(string regexName)
		{
			var path = Path.Combine(Directory.GetCurrentDirectory(), "Prompts", "RegexIntentDetector", regexName, "regex.txt");

			var regextContent = File.ReadAllLines(path);

			if(regextContent == null)
			{
				throw new Exception($"Error reading the regex file ({path})");
			}

			var regexList = regextContent.Select(x => new System.Text.RegularExpressions.Regex(x)).ToList();

			return regexList;
		}

		public void SetRegexConfig(string RegexName, List<string> regexContent)
		{
			var regexList = regexContent.Select(x => new System.Text.RegularExpressions.Regex(x)).ToList();

			_memoryCache.Set($"{CacheKey}_{RegexName}", regexList);
		}
	}
}
