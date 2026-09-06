using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Context;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Auth;
using Server.WebAPI.Services.Auth.Dtos;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/v1/[controller]")]
	public class AuthController : ControllerBase
	{
		private readonly IUserLoginService _userLoginService;
		private readonly ICurrentContext _currentContext;
		private readonly ILogger<AuthController> _logger;

		public AuthController(
			IUserLoginService userLoginService,
			ICurrentContext currentContext,
			ILogger<AuthController> logger)
		{
			_userLoginService = userLoginService;
			_currentContext = currentContext;
			_logger = logger;
		}

		[HttpPost("register-username")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> RegisterUsername([FromBody] RegisterUsernameRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.RegisterUsernameAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("login-username")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> LoginUsername([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.LoginUsernameAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}


		[HttpPost("register-otp")]
		public async Task<ActionResult<ServiceResponse<OtpSentResponseDto>>> RegisterOtp([FromBody] RegisterOtpRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.SendRegisterOtpAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("register-otp/verify")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> VerifyRegisterOtp([FromBody] RegisterOtpVerifyRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.VerifyRegisterOtpAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}


		[HttpPost("login-otp")]
		public async Task<ActionResult<ServiceResponse<OtpSentResponseDto>>> LoginOtp([FromBody] LoginOtpRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.SendLoginOtpAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("login-otp/verify")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> VerifyLoginOtp([FromBody] LoginOtpVerifyRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.VerifyLoginOtpAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("register-github")]
		[HttpPost("login-github")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> AuthGitHub([FromBody] ExternalAuthRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.LoginOrRegisterGitHubAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("register-google")]
		[HttpPost("login-google")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> AuthGoogle([FromBody] ExternalAuthRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.LoginOrRegisterGoogleAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[HttpPost("refresh")]
		public async Task<ActionResult<ServiceResponse<LoginResponseDto>>> RefreshToken([FromBody] RefreshTokenRequestDto request, CancellationToken cancellationToken)
		{
			var result = await _userLoginService.RefreshTokenAsync(request, cancellationToken);

			if(result.ErrorCode == ErrorCode.Unauthorized)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[Authorize]
		[HttpPost("logout")]
		public async Task<ActionResult<ServiceResponse<bool>>> Logout(CancellationToken cancellationToken)
		{
			var result = await _userLoginService.LogoutAsync(_currentContext.UserId, cancellationToken);
			
			if (!result.Success)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}

		[Authorize]
		[HttpGet("identity-user-info")]
		public ActionResult<ServiceResponse<UserInfoDto>> GetIdentityUserInfo()
		{
			var result = _userLoginService.GetUserInfo(_currentContext.UserId);
			
			if (!result.Success)
			{
				return Unauthorized(result);
			}

			return Ok(result);
		}
	}
}
