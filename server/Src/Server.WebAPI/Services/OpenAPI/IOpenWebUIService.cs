
using Server.WebAPI.Common.DependencyInjection;

namespace Server.WebAPI.Services.OpenAPI
{
	public interface IOpenWebUIService : ITransientService
	{
		/// <summary>
		/// Sends a prompt to OpenWebUI. If <paramref name="request.ChatId"/> exists, it will be used; otherwise a new chat will be created.
		/// Returns the assistant's response message and the resolved chat id.
		/// </summary>
		Task<OpenWebUISendPromptResponseDto> SendPromptAsync(OpenWebUISendPromptRequestDto request, CancellationToken cancellationToken = default);

		//get models 
		/// <summary>
		/// Retrieves the available models from OpenWebUI.
		/// </summary>
		Task<List<ModelDto>> GetAvailableModelsAsync(CancellationToken cancellationToken = default);
	}
}
