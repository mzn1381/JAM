using Server.WebAPI.Models.Base;

namespace Server.WebAPI.Models.Users
{
	public class User : BaseEntity
	{
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string PasswordHash { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }

		/// <summary>
		/// User's phone number for OTP-based authentication
		/// </summary>
		public string? PhoneNumber { get; set; }

		/// <summary>
		/// Indicates if the user's phone number has been verified
		/// </summary>
		public bool PhoneNumberVerified { get; set; } = false;

		/// <summary>
		/// GitHub user ID for GitHub OAuth authentication
		/// </summary>
		public string? GitHubId { get; set; }

		/// <summary>
		/// Google user ID for Google OAuth authentication
		/// </summary>
		public string? GoogleId { get; set; }

		/// <summary>
		/// Indicates if the user's email has been verified
		/// </summary>
		public bool EmailVerified { get; set; } = false;
		
		/// <summary>
		/// Number of consecutive failed login attempts
		/// </summary>
		public int FailedLoginAttempts { get; set; } = 0;
		
		/// <summary>
		/// Lockout end time if account is locked due to failed attempts
		/// </summary>
		public DateTime? LockoutEnd { get; set; }
		
		/// <summary>
		/// Last successful login timestamp
		/// </summary>
		public DateTime? LastLoginAt { get; set; }

		/// <summary>
		/// Current refresh token for the user
		/// </summary>
		public string? RefreshToken { get; set; }

		/// <summary>
		/// Expiry time of the current refresh token
		/// </summary>
		public DateTime? RefreshTokenExpiryTime { get; set; }
	}
}
