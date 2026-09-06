using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Config;

namespace Server.WebAPI.Services.OpenAPI.LLMModel
{
	public interface ILLMModelConfigService : ITransientService
	{
		string GetLLMModelName();
		void SetLLMModel(string modelName);
	}

	public class LLMModelConfigService : ILLMModelConfigService
	{
		private static string CacheKey = "LLMModelConfig";

		private readonly ServerSetting _serverSetting;
		private readonly IMemoryCache _memoryCache;

		public LLMModelConfigService(IOptionsMonitor<ServerSetting> optionsMonitor,
			IMemoryCache memoryCache)
		{
			_serverSetting = optionsMonitor.CurrentValue;
			_memoryCache = memoryCache;
		}
		public string GetLLMModelName()
		{
			var modelName = _memoryCache.Get(CacheKey);

			if (modelName == null)
			{
				modelName = _serverSetting.OpenWebUI.ModelName;
				_memoryCache.Set(CacheKey, modelName);
			}

			return modelName.ToString() ?? string.Empty;
		}

		public void SetLLMModel(string modelName)
		{
			_memoryCache.Set(CacheKey, modelName);
		}
	}
}
