namespace Server.WebAPI.Services.Auth.Dtos
{
	public class LoginResponseDto
	{
		public string AccessToken { get; set; } = string.Empty;
		public string RefreshToken { get; set; } = string.Empty;
		public int ExpiresIn { get; set; }
		public string TokenType { get; set; } = "Bearer";
		public UserInfoDto User { get; set; } = new();
	}

	public class UserInfoDto
	{
		public Guid Id { get; set; }
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
		public List<string> Roles { get; set; } = new();
	}

	public class RefreshTokenRequestDto
	{
		public string AccessToken { get; set; } = string.Empty;
		public string RefreshToken { get; set; } = string.Empty;
	}

	public class RegisterUsernameRequestDto
	{
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string Password { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public class LoginRequestDto
	{
		public string Username { get; set; } = string.Empty;
		public string Password { get; set; } = string.Empty;
	}


	public class RegisterOtpRequestDto
	{
		public string PhoneNumber { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public class RegisterOtpVerifyRequestDto
	{
		public string PhoneNumber { get; set; } = string.Empty;
		public string Code { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public class LoginOtpRequestDto
	{
		public string PhoneNumber { get; set; } = string.Empty;
	}

	public class LoginOtpVerifyRequestDto
	{
		public string PhoneNumber { get; set; } = string.Empty;
		public string Code { get; set; } = string.Empty;
	}

	public class OtpSentResponseDto
	{
		public bool ShouldWait { get; set; }
		public int ExpiresInSeconds { get; set; }
		public int WaitInSeconds { get; set; }
	}


	public class ExternalAuthRequestDto
	{
		public string Code { get; set; } = string.Empty;
		public string? RedirectUri { get; set; }
	}
}
