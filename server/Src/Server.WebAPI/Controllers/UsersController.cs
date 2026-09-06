using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Context;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Users;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/v1/[controller]")]
	//[Authorize]
	public class UsersController : ControllerBase
	{
		private readonly IUserService _service;
		private readonly ICurrentContext _currentContext;

		public UsersController(IUserService service, ICurrentContext currentContext)
		{
			_service = service;
			_currentContext = currentContext;
		}

		[HttpGet]
		public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
		{
			var res = await _service.GetAllAsync(page, pageSize, cancellationToken);
			return Ok(res);
		}

		[HttpGet("{id}")]
		public async Task<IActionResult> GetById(Guid id)
		{
			var res = await _service.GetByIdAsync(id);
			if (!res.Success || res.Data == null)
				return NotFound(res);
			return Ok(res);
		}

		[HttpPost]
		[AllowAnonymous] // Allow registration without authentication
		public async Task<IActionResult> Create([FromBody] CreateUserDto user)
		{
			var res = await _service.CreateAsync(user);
			if (!res.Success)
			{
				return res.ErrorCode switch
				{
					ErrorCode.Conflict => Conflict(res),
					ErrorCode.ValidationError => BadRequest(res),
					ErrorCode.None => StatusCode(500, res), // Should not happen - internal error
					_ => BadRequest(res)
				};
			}
			return CreatedAtAction(nameof(GetById), new { id = res.Data.Id }, res);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto user)
		{
			var res = await _service.UpdateAsync(id, user);
			if (!res.Success || res.Data == null)
			{
				return res.ErrorCode switch
				{
					ErrorCode.NotFound => NotFound(res),
					ErrorCode.Conflict => Conflict(res),
					ErrorCode.None => StatusCode(500, res), // Should not happen - internal error
					_ => BadRequest(res)
				};
			}
			return Ok(res);
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(Guid id)
		{
			var res = await _service.DeleteAsync(id);
			if (!res.Success)
				return NotFound(res);
			return Ok(res);
		}

		[HttpPost("change-password")]
		public async Task<ActionResult<ServiceResponse<bool>>> ChangePassword([FromBody] ChangePasswordDto dto)
		{
			var res = await _service.ChangePasswordAsync(_currentContext.UserId, dto);
			if (!res.Success)
			{
				return res.ErrorCode switch
				{
					ErrorCode.NotFound => NotFound(res),
					ErrorCode.Unauthorized => Unauthorized(res),
					ErrorCode.ValidationError => BadRequest(res),
					ErrorCode.None => StatusCode(500, res), // Should not happen - internal error
					_ => BadRequest(res)
				};
			}

			return Ok(res);
		}
	}
}
