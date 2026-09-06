using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Auth.Dtos;

namespace Server.WebAPI.Services.Auth
{
	public interface IUserLoginService : IScopedService
	{
		// ── Username/Password ──
		Task<ServiceResponse<LoginResponseDto>> RegisterUsernameAsync(RegisterUsernameRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<LoginResponseDto>> LoginUsernameAsync(LoginRequestDto request, CancellationToken cancellationToken);

		// ── OTP ──
		Task<ServiceResponse<OtpSentResponseDto>> SendRegisterOtpAsync(RegisterOtpRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<LoginResponseDto>> VerifyRegisterOtpAsync(RegisterOtpVerifyRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<OtpSentResponseDto>> SendLoginOtpAsync(LoginOtpRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<LoginResponseDto>> VerifyLoginOtpAsync(LoginOtpVerifyRequestDto request, CancellationToken cancellationToken);

		// ── External Providers ──
		Task<ServiceResponse<LoginResponseDto>> LoginOrRegisterGitHubAsync(ExternalAuthRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<LoginResponseDto>> LoginOrRegisterGoogleAsync(ExternalAuthRequestDto request, CancellationToken cancellationToken);

		// ── Common ──
		Task<ServiceResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken);
		Task<ServiceResponse<bool>> LogoutAsync(Guid userId, CancellationToken cancellationToken);
		ServiceResponse<UserInfoDto> GetUserInfo(Guid userId);
	}
}
