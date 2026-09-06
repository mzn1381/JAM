using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Common.Context;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Auth;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Auth.Dtos;
using Server.WebAPI.Services.Auth.JWT;
using Server.WebAPI.Services.Auth.OTP;

namespace Server.WebAPI.Services.Auth
{
	public class UserLoginService : IUserLoginService
	{
		private readonly ServerDbContext _dbContext;
		private readonly IJwtService _jwtService;
		private readonly IPasswordHasher _passwordHasher;
		private readonly IOTPService _otpService;
		private readonly IExternalAuthService _externalAuthService;
		private readonly ICurrentContext _currentContext;
		private readonly ServerSetting _serverSetting;
		private readonly ILogger<UserLoginService> _logger;

		public UserLoginService(
			ServerDbContext dbContext,
			IJwtService jwtService,
			IPasswordHasher passwordHasher,
			IOTPService otpService,
			IExternalAuthService externalAuthService,
			ICurrentContext currentContext,
			IOptionsMonitor<ServerSetting> optionsMonitor,
			ILogger<UserLoginService> logger)
		{
			_dbContext = dbContext;
			_jwtService = jwtService;
			_passwordHasher = passwordHasher;
			_otpService = otpService;
			_externalAuthService = externalAuthService;
			_currentContext = currentContext;
			_serverSetting = optionsMonitor.CurrentValue;
			_logger = logger;
		}


		public async Task<ServiceResponse<LoginResponseDto>> RegisterUsernameAsync(RegisterUsernameRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Register attempt for user: {Username}", request.Username);

			var validation = ValidatePassword(request.Password);
			if(!validation.IsValid)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = validation.ErrorMessage,
					ErrorCode = ErrorCode.ValidationError
				};
			}

			var exists = await _dbContext.Users
				.AnyAsync(u => u.Username == request.Username || u.Email == request.Email, cancellationToken);

			if(exists)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = "Username or email already exists",
					ErrorCode = ErrorCode.Conflict
				};
			}

			var user = new User
			{
				Username = request.Username,
				Email = request.Email,
				PasswordHash = _passwordHasher.HashPassword(request.Password),
				FirstName = request.FirstName,
				LastName = request.LastName
			};

			_dbContext.Users.Add(user);
			await _dbContext.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("User registered successfully: {Username}", request.Username);

			return await IssueTokensAsync(user, cancellationToken);
		}

		public async Task<ServiceResponse<LoginResponseDto>> LoginUsernameAsync(LoginRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Login attempt for user: {Username}", request.Username);

			var user = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username, cancellationToken);

			if(user == null)
			{
				_logger.LogWarning("Login failed: User not found for {Username}", request.Username);
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = "Invalid username or password",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var lockout = CheckLockout(user, request.Username);
			if(lockout != null) return lockout;

			if(!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
			{
				await RecordFailedAttemptAsync(user, request.Username, cancellationToken);

				_logger.LogWarning("Login failed: Invalid password for {Username}. Failed attempts: {Attempts}",
					request.Username, user.FailedLoginAttempts);

				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = "Invalid username or password",
					ErrorCode = ErrorCode.Unauthorized,

				};
			}

			_logger.LogInformation("Login successful for user: {Username}", request.Username);
			return await IssueTokensAsync(user, cancellationToken);
		}

		// ════════════════════════════════════════
		//  Register / Login – OTP
		// ════════════════════════════════════════

		public async Task<ServiceResponse<OtpSentResponseDto>> SendRegisterOtpAsync(RegisterOtpRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Register OTP request for phone: {Phone}", request.PhoneNumber);

			//var exists = await _dbContext.Users
			//	.AnyAsync(u => u.PhoneNumber == request.PhoneNumber && u.PhoneNumberVerified, cancellationToken);

			//if(exists)
			//{
			//	return new ServiceResponse<OtpSentResponseDto>
			//	{
			//		Success = true,
			//		Message = "Phone number is already registered",
			//		ErrorCode = ErrorCode.Conflict,
			//	};
			//}

			var sendOTPResult = await _otpService.SendSMSOTP(request.PhoneNumber, cancellationToken);
			if(sendOTPResult.IsSuccessful == false)
			{
				return new ServiceResponse<OtpSentResponseDto>
				{
					Success = false,
					Message = sendOTPResult.Message,
				};
			}

			if(sendOTPResult.Date.ShouldWait)
			{
				_logger.LogWarning("OTP request too soon for phone: {Phone}. Must wait {Seconds} seconds",
					request.PhoneNumber, sendOTPResult.Date.WaitInSeconds);

				return new ServiceResponse<OtpSentResponseDto>
				{
					Success = true,
					Message = $"Please wait {sendOTPResult.Date.WaitInSeconds} seconds before requesting another code",
					ErrorCode = ErrorCode.ValidationError,
					Data = new OtpSentResponseDto
					{
						ShouldWait = true,
						WaitInSeconds = sendOTPResult.Date.WaitInSeconds
					}
				};
			}

			_logger.LogInformation("Register OTP sent for phone: {Phone}", request.PhoneNumber);

			return new ServiceResponse<OtpSentResponseDto>
			{
				Success = true,
				Message = "Verification code sent",
				Data = new OtpSentResponseDto
				{
					ShouldWait = false,
					ExpiresInSeconds = sendOTPResult.Date.ExpiresInSeconds
				}
			};
		}

		public async Task<ServiceResponse<LoginResponseDto>> VerifyRegisterOtpAsync(RegisterOtpVerifyRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Verify register OTP for phone: {Phone}", request.PhoneNumber);

			var verifyResult = await _otpService.VerifySMSOTP(request.PhoneNumber, request.Code, cancellationToken);
			if(verifyResult.IsSuccessful == false)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = verifyResult.Message
				};
			}

			// expired
			if(verifyResult.Date.Expired == true)
			{
				_logger.LogWarning("OTP code expired for phone: {Phone}", request.PhoneNumber);

				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Verification code has expired. Please request a new one.",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}


			// un-verify
			if(verifyResult.Date.Verified == false)
			{
				_logger.LogWarning("OTP code already used for phone: {Phone}", request.PhoneNumber);

				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Verification code is Invalid",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var user = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber, cancellationToken);

			if(user == null)
			{
				user = new User
				{
					Username = request.PhoneNumber,
					Email = string.Empty,
					PasswordHash = string.Empty,
					PhoneNumber = request.PhoneNumber,
					PhoneNumberVerified = true,
					FirstName = request.FirstName,
					LastName = request.LastName
				};
				_dbContext.Users.Add(user);
			}
			else
			{
				user.PhoneNumberVerified = true;
				if(!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName;
				if(!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName;
			}

			await _dbContext.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("Register OTP verified for phone: {Phone}", request.PhoneNumber);
			return await IssueTokensAsync(user, cancellationToken);
		}

		public async Task<ServiceResponse<OtpSentResponseDto>> SendLoginOtpAsync(LoginOtpRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Login OTP request for phone: {Phone}", request.PhoneNumber);

			var user = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber && u.PhoneNumberVerified, cancellationToken);

			if(user == null)
			{
				return new ServiceResponse<OtpSentResponseDto>
				{
					Message = "Phone number is not registered",
					ErrorCode = ErrorCode.ValidationError,
				};
			}

			var lockout = CheckLockout(user, request.PhoneNumber);
			if(lockout != null)
			{
				return new ServiceResponse<OtpSentResponseDto>
				{
					Message = lockout.Message,
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var sendOTPResult = await _otpService.SendSMSOTP(request.PhoneNumber, cancellationToken);
			if(sendOTPResult.IsSuccessful == false)
			{
				await RecordFailedAttemptAsync(user, request.PhoneNumber, cancellationToken);
				return new ServiceResponse<OtpSentResponseDto>
				{
					Success = false,
					Message = sendOTPResult.Message,
				};
			}

			if(sendOTPResult.Date.ShouldWait)
			{
				_logger.LogWarning("OTP request too soon for phone: {Phone}. Must wait {Seconds} seconds",
					request.PhoneNumber, sendOTPResult.Date.WaitInSeconds);

				return new ServiceResponse<OtpSentResponseDto>
				{
					Success = true,
					Message = $"Please wait {sendOTPResult.Date.WaitInSeconds} seconds before requesting another code",
					Data = new OtpSentResponseDto
					{
						ShouldWait = true,
						WaitInSeconds = sendOTPResult.Date.WaitInSeconds,
					},
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			_logger.LogInformation("Login OTP sent for phone: {Phone}", request.PhoneNumber);

			return new ServiceResponse<OtpSentResponseDto>
			{
				Success = true,
				Message = "Verification code sent",
				Data = new OtpSentResponseDto
				{
					ShouldWait = false,
					ExpiresInSeconds = sendOTPResult.Date.ExpiresInSeconds
				}
			};
		}

		public async Task<ServiceResponse<LoginResponseDto>> VerifyLoginOtpAsync(LoginOtpVerifyRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Verify login OTP for phone: {Phone}", request.PhoneNumber);

			var user = await _dbContext.Users
				.FirstOrDefaultAsync(u => u.PhoneNumber == request.PhoneNumber && u.PhoneNumberVerified, cancellationToken);

			if(user == null)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = true,
					Message = "Phone number is not registered",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var lockout = CheckLockout(user, request.PhoneNumber);
			if(lockout != null) return lockout;

			var verifyResult = await _otpService.VerifySMSOTP(request.PhoneNumber, request.Code, cancellationToken);
			if(verifyResult.IsSuccessful == false)
			{
				await RecordFailedAttemptAsync(user, request.PhoneNumber, cancellationToken);
				return new ServiceResponse<LoginResponseDto> { Success = false, Message = verifyResult.Message };
			}

			// expired
			if(verifyResult.Date.Expired == true)
			{
				_logger.LogWarning("OTP code expired for phone: {Phone}", request.PhoneNumber);

				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Verification code has expired. Please request a new one.",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}


			// un-verify
			if(verifyResult.Date.Verified == false)
			{
				_logger.LogWarning("OTP code already used for phone: {Phone}", request.PhoneNumber);

				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Verification code is Invalid",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			_logger.LogInformation("Login OTP verified for phone: {Phone}", request.PhoneNumber);
			return await IssueTokensAsync(user, cancellationToken);
		}

		// ════════════════════════════════════════
		//  Register / Login – External Providers
		// ════════════════════════════════════════

		public async Task<ServiceResponse<LoginResponseDto>> LoginOrRegisterGitHubAsync(ExternalAuthRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("GitHub auth request");

			var externalUser = await _externalAuthService.GetUserAsync(ExternalAuthProvider.GitHub, request.Code, request.RedirectUri, cancellationToken);
			if(externalUser == null)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Failed to authenticate with GitHub",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			return await LoginOrRegisterExternalAsync(ExternalAuthProvider.GitHub, externalUser, cancellationToken);
		}

		public async Task<ServiceResponse<LoginResponseDto>> LoginOrRegisterGoogleAsync(ExternalAuthRequestDto request, CancellationToken cancellationToken)
		{
			_logger.LogInformation("Google auth request");

			var externalUser = await _externalAuthService.GetUserAsync(ExternalAuthProvider.Google, request.Code, request.RedirectUri, cancellationToken);
			if(externalUser == null)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = "Failed to authenticate with Google"
				};
			}

			return await LoginOrRegisterExternalAsync(ExternalAuthProvider.Google, externalUser, cancellationToken);
		}

		private async Task<ServiceResponse<LoginResponseDto>> LoginOrRegisterExternalAsync(ExternalAuthProvider provider, ExternalUserInfo externalUser, CancellationToken cancellationToken)
		{
			User? user = null;

			if(provider == ExternalAuthProvider.GitHub)
			{
				user = await _dbContext.Users
					.FirstOrDefaultAsync(u => u.GitHubId == externalUser.ProviderId, cancellationToken);
			}
			else if(provider == ExternalAuthProvider.Google)
			{
				user = await _dbContext.Users
					.FirstOrDefaultAsync(u => u.GoogleId == externalUser.ProviderId, cancellationToken);
			}

			if(user != null)
			{
				var lockout = CheckLockout(user, $"{provider}:{externalUser.ProviderId}");
				if(lockout != null) return lockout;

				_logger.LogInformation("{Provider} login successful for user: {Username}", provider, user.Username);
				return await IssueTokensAsync(user, cancellationToken);
			}

			if(!string.IsNullOrEmpty(externalUser.Email))
			{
				user = await _dbContext.Users
					.FirstOrDefaultAsync(u => u.Email == externalUser.Email, cancellationToken);

				if(user != null)
				{
					if(provider == ExternalAuthProvider.GitHub)
					{
						if(!string.IsNullOrEmpty(user.GitHubId) && user.GitHubId != externalUser.ProviderId)
						{
							return new ServiceResponse<LoginResponseDto>
							{
								Success = false,
								Message = "This email is already associated with a different GitHub account"
							};
						}
						user.GitHubId = externalUser.ProviderId;
					}
					else if(provider == ExternalAuthProvider.Google)
					{
						if(!string.IsNullOrEmpty(user.GoogleId) && user.GoogleId != externalUser.ProviderId)
						{
							return new ServiceResponse<LoginResponseDto>
							{
								Success = false,
								Message = "This email is already associated with a different Google account"
							};
						}
						user.GoogleId = externalUser.ProviderId;
					}

					user.EmailVerified = true;

					_logger.LogInformation("{Provider} account linked to existing user: {Username}", provider, user.Username);
					return await IssueTokensAsync(user, cancellationToken);
				}
			}

			var username = externalUser.Username ?? externalUser.Email ?? $"{provider}_{externalUser.ProviderId}";

			var usernameExists = await _dbContext.Users.AnyAsync(u => u.Username == username, cancellationToken);
			if(usernameExists)
			{
				username = $"{username}_{Guid.NewGuid().ToString("N")[..6]}";
			}

			user = new User
			{
				Username = username,
				Email = externalUser.Email ?? string.Empty,
				PasswordHash = string.Empty,
				FirstName = externalUser.FirstName,
				LastName = externalUser.LastName,
				EmailVerified = !string.IsNullOrEmpty(externalUser.Email)
			};

			if(provider == ExternalAuthProvider.GitHub)
			{
				user.GitHubId = externalUser.ProviderId;
			}
			else if(provider == ExternalAuthProvider.Google)
			{
				user.GoogleId = externalUser.ProviderId;
			}

			_dbContext.Users.Add(user);
			await _dbContext.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("{Provider} user registered: {Username}", provider, user.Username);
			return await IssueTokensAsync(user, cancellationToken);
		}

		// ════════════════════════════════════════
		//  Common – Refresh / Logout / UserInfo
		// ════════════════════════════════════════

		public async Task<ServiceResponse<LoginResponseDto>> RefreshTokenAsync(RefreshTokenRequestDto request, CancellationToken cancellationToken)
		{
			if(string.IsNullOrEmpty(request.RefreshToken))
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = true,
					Message = "Refresh token is required",
					ErrorCode = ErrorCode.ValidationError,
				};
			}

			var principal = _jwtService.ValidateExpiredToken(request.AccessToken);
			if(principal == null)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Invalid access token",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var userIdClaim = principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
			if(!Guid.TryParse(userIdClaim, out var userId))
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Message = "Invalid token claims",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var user = await _dbContext.Users.FindAsync(new object[] { userId }, cancellationToken);
			if(user == null)
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Message = "User not found",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var lockout = CheckLockout(user, userId.ToString());
			if(lockout != null) return lockout;

			if(string.IsNullOrEmpty(user.RefreshToken) ||
				!string.Equals(user.RefreshToken, request.RefreshToken, StringComparison.Ordinal))
			{
				return new ServiceResponse<LoginResponseDto>
				{
					Success = false,
					Message = "Invalid refresh token",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			if(user.RefreshTokenExpiryTime.HasValue && user.RefreshTokenExpiryTime.Value <= DateTime.UtcNow)
			{
				user.RefreshToken = null;
				user.RefreshTokenExpiryTime = null;
				await _dbContext.SaveChangesAsync(cancellationToken);

				return new ServiceResponse<LoginResponseDto>
				{
					Success = true,
					Message = "Refresh token has expired. Please login again",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var newAccessToken = _jwtService.GenerateAccessToken(user);
			var newRefreshToken = _jwtService.GenerateRefreshToken();

			user.RefreshToken = newRefreshToken;
			user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_serverSetting.Jwt.RefreshTokenExpirationDays);
			await _dbContext.SaveChangesAsync(cancellationToken);

			return new ServiceResponse<LoginResponseDto>
			{
				Success = true,
				Message = "Token refreshed successfully",
				Data = BuildLoginResponse(user, newAccessToken, newRefreshToken)
			};
		}

		public async Task<ServiceResponse<bool>> LogoutAsync(Guid userId, CancellationToken cancellationToken)
		{
			var user = await _dbContext.Users.FindAsync(new object[] { userId }, cancellationToken);
			if(user == null)
			{
				return new ServiceResponse<bool>
				{
					Message = "User not found",
					ErrorCode = ErrorCode.ValidationError,
				};
			}

			user.RefreshToken = null;
			user.RefreshTokenExpiryTime = null;
			await _dbContext.SaveChangesAsync(cancellationToken);

			_logger.LogInformation("User {UserId} logged out successfully", userId);

			return new ServiceResponse<bool>
			{
				Success = true,
				Message = "Logged out successfully",
				Data = true
			};
		}

		public ServiceResponse<UserInfoDto> GetUserInfo(Guid userId)
		{
			if(!_currentContext.IsAuthenticated || _currentContext.User == null)
			{
				return new ServiceResponse<UserInfoDto>
				{
					Message = "User is not authenticated",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			var user = _currentContext.User;

			_logger.LogInformation("Identity user info requested for user: {Username}", user.Username);

			return new ServiceResponse<UserInfoDto>
			{
				Success = true,
				Message = "User info retrieved successfully",
				Data = new UserInfoDto
				{
					Id = user.Id,
					Username = user.Username,
					Email = user.Email,
					FirstName = user.FirstName,
					LastName = user.LastName,
					Roles = user.Roles
				}
			};
		}



		private static (bool IsValid, string ErrorMessage) ValidatePassword(string password)
		{
			if(string.IsNullOrWhiteSpace(password))
				return (false, "Password is required");
			if(password.Length < 8)
				return (false, "Password must be at least 8 characters long");
			if(password.Length > 128)
				return (false, "Password must not exceed 128 characters");
			if(!password.Any(char.IsUpper))
				return (false, "Password must contain at least one uppercase letter");
			if(!password.Any(char.IsLower))
				return (false, "Password must contain at least one lowercase letter");
			if(!password.Any(char.IsDigit))
				return (false, "Password must contain at least one digit");
			if(!password.Any(c => !char.IsLetterOrDigit(c)))
				return (false, "Password must contain at least one special character");

			return (true, string.Empty);
		}

		private LoginResponseDto BuildLoginResponse(User user, string accessToken, string refreshToken)
		{
			return new LoginResponseDto
			{
				AccessToken = accessToken,
				RefreshToken = refreshToken,
				ExpiresIn = _serverSetting.Jwt.AccessTokenExpirationMinutes * 60,
				TokenType = "Bearer",
				User = new UserInfoDto
				{
					Id = user.Id,
					Username = user.Username,
					Email = user.Email,
					FirstName = user.FirstName,
					LastName = user.LastName
				}
			};
		}

		private async Task<ServiceResponse<LoginResponseDto>> IssueTokensAsync(User user, CancellationToken cancellationToken)
		{
			var accessToken = _jwtService.GenerateAccessToken(user);
			var refreshToken = _jwtService.GenerateRefreshToken();

			user.FailedLoginAttempts = 0;
			user.LockoutEnd = null;
			user.LastLoginAt = DateTime.UtcNow;
			user.RefreshToken = refreshToken;
			user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(_serverSetting.Jwt.RefreshTokenExpirationDays);

			await _dbContext.SaveChangesAsync(cancellationToken);

			return new ServiceResponse<LoginResponseDto>
			{
				Success = true,
				Message = "Login successful",
				Data = BuildLoginResponse(user, accessToken, refreshToken)
			};
		}

		private ServiceResponse<LoginResponseDto>? CheckLockout(User user, string identifier)
		{
			if(user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
			{
				var remaining = user.LockoutEnd.Value - DateTime.UtcNow;
				_logger.LogWarning("Account locked for {Identifier}. Remaining: {Minutes} minutes",
					identifier, Math.Ceiling(remaining.TotalMinutes));

				return new ServiceResponse<LoginResponseDto>
				{
					Message = $"Account is locked. Please try again in {Math.Ceiling(remaining.TotalMinutes)} minutes",
					ErrorCode = ErrorCode.Unauthorized,
				};
			}

			return null;
		}

		private async Task RecordFailedAttemptAsync(User user, string identifier, CancellationToken cancellationToken)
		{
			user.FailedLoginAttempts++;

			if(user.FailedLoginAttempts >= _serverSetting.Login.MaxFailedAttempts)
			{
				user.LockoutEnd = DateTime.UtcNow.Add(TimeSpan.FromMinutes(_serverSetting.Login.LockoutDurationMinutes));
				_logger.LogWarning("Account locked due to {Attempts} failed attempts for {Identifier}",
					user.FailedLoginAttempts, identifier);
			}

			await _dbContext.SaveChangesAsync(cancellationToken);
		}
	}
}
