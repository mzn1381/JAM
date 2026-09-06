using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Services.Chat.ContextManagement;

namespace Server.WebAPI.Services.NaturalLanguageGeneratore
{
	public interface INaturalLanguageGeneratoreService : ITransientService
	{
		Task<NaturalLanguageGeneratorResult> GenerateMessage(NaturalLanguageGeneratorInput input);
	}

	public enum NaturalLanguageGeneratorType
	{
		none,
		Welcome,
		introduction,
		missing_info,
		successful,
	}

	public class NaturalLanguageGeneratorInput
	{
		public PishkarContext PishkarContext { get; set; } = new();
		public NaturalLanguageGeneratorType? NaturalLanguageGeneratorType { get; set; }
	}

	public class NaturalLanguageGeneratorResult
	{
		public string Message { get; set; } = string.Empty;
	}
}
