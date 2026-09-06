using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Chat.ContextManagement.UserContextManager;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/v1/[controller]")]
	[Authorize]
	public class UserContextController : ControllerBase
	{
		private readonly IUserContextManager _userContextManager;
		private readonly ILogger<UserContextController> _logger;

		public UserContextController(IUserContextManager userContextManager,
			ILogger<UserContextController> logger)
		{
			_userContextManager = userContextManager;
			_logger = logger;
		}

		[HttpPost]
		public async Task<ActionResult<ServiceResponse<bool>>> CreatePreferences([FromBody] UserContextDto input, CancellationToken cancellationToken = default)
		{
			if(input == null || input.PreferencesItems == null)
			{
				_logger.LogWarning("CreatePreferences called with null input or null PreferencesItems.");

				return BadRequest(new ServiceResponse<bool>()
				{
					Data = false,
					Message = "PreferencesItems cannot be null.",
					Success = false,
				});
			}

			_logger.LogInformation("Creating user preferences with {Count} items", input.PreferencesItems.Count);

			// TODO: user identification
			await _userContextManager.CreateUserExplainer(input, Guid.Empty, cancellationToken);

			_logger.LogInformation("User preferences created successfully");

			return Ok(new ServiceResponse<bool>()
			{
				Data = true,

				Message = "Create preferences successfully",
				Success = true,
			});
		}
	}
}
