using Server.WebAPI.Models.Base;

namespace Server.WebAPI.Models.Auth
{
	public class OtpVerification : BaseEntity
	{
		/// <summary>
		/// Phone number or email the OTP was sent to
		/// </summary>
		public string Destination { get; set; } = string.Empty;

		/// <summary>
		/// The hashed OTP code
		/// </summary>
		public string CodeHash { get; set; } = string.Empty;

		/// <summary>
		/// RawCode only used for test environment
		/// </summary>
		public string? RawCode { get; set; }

		/// <summary>
		/// When the OTP expires
		/// </summary>
		public DateTime ExpiresAt { get; set; }

		/// <summary>
		/// Number of verification attempts for this OTP
		/// </summary>
		public int Attempts { get; set; } = 0;

		/// <summary>
		/// Whether this OTP has been consumed successfully
		/// </summary>
		public bool IsUsed { get; set; } = false;
	}
}
