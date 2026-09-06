using Server.WebAPI.Common.DependencyInjection;
using System.Security.Cryptography;

namespace Server.WebAPI.Services.Auth
{
	public interface IPasswordHasher : IScopedService
	{
		string HashPassword(string password);
		bool VerifyPassword(string password, string hashedPassword);
	}

	public class PasswordHasher : IPasswordHasher
	{
		private const int SaltSize = 16; // 128 bits
		private const int KeySize = 32; // 256 bits
		private const int Iterations = 100000; // OWASP recommended minimum for PBKDF2-SHA256
		private static readonly HashAlgorithmName HashAlgorithm = HashAlgorithmName.SHA256;

		private const char Delimiter = ':';

		public string HashPassword(string password)
		{
			ArgumentException.ThrowIfNullOrWhiteSpace(password);

			var salt = RandomNumberGenerator.GetBytes(SaltSize);
			var hash = Rfc2898DeriveBytes.Pbkdf2(
				password,
				salt,
				Iterations,
				HashAlgorithm,
				KeySize
			);

			// Format: iterations:salt:hash (all base64 encoded except iterations)
			return string.Join(
				Delimiter,
				Iterations,
				Convert.ToBase64String(salt),
				Convert.ToBase64String(hash)
			);
		}

		public bool VerifyPassword(string password, string hashedPassword)
		{
			if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hashedPassword))
				return false;

			try
			{
				var parts = hashedPassword.Split(Delimiter);
				if (parts.Length != 3)
					return false;

				var iterations = int.Parse(parts[0]);
				var salt = Convert.FromBase64String(parts[1]);
				var storedHash = Convert.FromBase64String(parts[2]);

				var computedHash = Rfc2898DeriveBytes.Pbkdf2(
					password,
					salt,
					iterations,
					HashAlgorithm,
					storedHash.Length
				);

				// Use constant-time comparison to prevent timing attacks
				return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
			}
			catch
			{
				return false;
			}
		}
	}
}
