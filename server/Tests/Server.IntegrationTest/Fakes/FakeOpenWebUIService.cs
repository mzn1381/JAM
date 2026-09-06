using Server.WebAPI.Services.OpenAPI;

namespace Server.IntegrationTest.Fakes
{
	//internal class FakeOpenWebUIService : IOpenWebUIService
	//{
	//	public Task<List<ModelDto>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
	//	{
	//		return Task.FromResult(new List<ModelDto>
	//		{
	//			new ModelDto { Name = "test-model", Description = "Fake model for tests" }
	//		});
	//	}

	//	public Task<OpenWebUISendPromptResponseDto> SendPromptAsync(OpenWebUISendPromptRequestDto request, CancellationToken cancellationToken = default)
	//	{
	//		var resp = new OpenWebUISendPromptResponseDto
	//		{
	//			ResponseMessage = $"[fake-response] {request.Prompt}",
	//			ResolvedChatId = string.IsNullOrWhiteSpace(request.ChatId) ? Guid.NewGuid().ToString("N") : request.ChatId,
	//			TokensUsed = Math.Min(64, request.Prompt?.Length ?? 0),
	//			DurationMs = 10
	//		};
	//		return Task.FromResult(resp);
	//	}
	//}
}
