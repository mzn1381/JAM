using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Services.Chat.Prompt;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	//[Authorize]
	public class PromptConfigController : ControllerBase
	{
		private readonly IPromptConfigService _promptConfigService;

		public PromptConfigController(IPromptConfigService promptConfigService)
		{
			_promptConfigService = promptConfigService;
		}

		/// <summary>
		/// Gets the prompt content for the specified prompt name.
		/// </summary>
		/// <param name="promptName">The prompt identifier (e.g., introduction, intent_detector, set_alarm, set_calendar).</param>
		/// <returns>The prompt content.</returns>
		[HttpGet("{promptName}")]
		public ActionResult<string> GetPrompt(string promptName)
		{
			var prompt = _promptConfigService.GetPromptConfig(promptName);
			return Ok(prompt ?? string.Empty);
		}

		/// <summary>
		/// Updates the prompt content for the specified prompt name.
		/// </summary>
		/// <param name="promptName">The prompt identifier (e.g., introduction, intent_detector, set_alarm, set_calendar).</param>
		/// <param name="request">The new prompt content.</param>
		/// <returns>No content on success.</returns>
		[HttpPut("{promptName}")]
		public IActionResult SetPrompt(string promptName, [FromBody] SetPromptRequest request)
		{
			if (request is null || string.IsNullOrWhiteSpace(request.Content))
				return BadRequest("Prompt content is required.");

			_promptConfigService.SetPromptConfig(promptName, request.Content);
			return NoContent();
		}

		public class SetPromptRequest
		{
			public string Content { get; set; } = string.Empty;
		}
	}
}