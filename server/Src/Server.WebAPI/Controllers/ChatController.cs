using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Chat;

namespace Server.WebAPI.Controllers
{
	[Route("api/v1/[controller]")]
	[ApiController]
	//[Authorize]
	public class ChatController : ControllerBase
	{
		private readonly IChatService _chatService;
		private readonly ILogger<ChatController> _logger;

		public ChatController(IChatService chatService,
			ILogger<ChatController> logger)
		{
			_chatService = chatService;
			_logger = logger;
		}

		[HttpPost]
		public async Task<ActionResult<ServiceResponse<AskResultDto>>> Ask([FromBody] AskInputDto input)
		{
			_logger.LogInformation("Received Ask request for ChatId: {ChatId} with {TaskCount} tasks.",
				input.ChatId, input.Tasks.Count);

			var result = await _chatService.AskAsync(input);

			_logger.LogInformation("Processed Ask request for ChatId: {ChatId}. TokensUsed: {TokensUsed}, DurationMs: {DurationMs}.",
				input.ChatId, result.TotalTokensUsed, result.TotalDurationMs);

			var response = new ServiceResponse<AskResultDto>
			{
				Data = result,
				Success = true,
				Message = "Request processed successfully. =)"
			};

			return Ok(response);
		}
	}
}
