using Server.WebAPI.Common.DependencyInjection;

namespace Server.WebAPI.Services.Chat.IntetDetector
{

	public interface IInternalIntentDetector : ITransientService
	{
		InternalIntentResultDto DetectIntentAsync(string message, CancellationToken cancellationToken = default);
	}
}
