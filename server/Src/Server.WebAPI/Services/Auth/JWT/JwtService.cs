using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Auth;
using Server.WebAPI.Models.Users;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Server.WebAPI.Services.Auth.JWT
{
	public interface IJwtService : IScopedService
	{
		string GenerateAccessToken(User user, IEnumerable<string>? roles = null);
		string GenerateRefreshToken();
		ClaimsPrincipal? ValidateToken(string token);
		ClaimsPrincipal? ValidateExpiredToken(string token);
		TokenValidationResult ValidateTokenWithResult(string token);
	}

	public class JwtService : IJwtService
	{
		private readonly IOptionsMonitor<ServerSetting> _serverSettingMonitor;
		private readonly ILogger<JwtService> _logger;

		private JwtSetting JwtSetting => _serverSettingMonitor.CurrentValue.Jwt;

		public JwtService(IOptionsMonitor<ServerSetting> serverSettingMonitor, ILogger<JwtService> logger)
		{
			_serverSettingMonitor = serverSettingMonitor;
			_logger = logger;
		}

		public string GenerateAccessToken(User user, IEnumerable<string>? roles = null)
		{
			var jwtSetting = JwtSetting;
			var claims = new List<Claim>
			{
				new(ClaimTypes.NameIdentifier, user.Id.ToString()),
				new(ClaimTypes.Name, user.Username),
				new(ClaimTypes.Email, user.Email),
				new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
				new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
			};

			if (!string.IsNullOrWhiteSpace(user.FirstName))
				claims.Add(new Claim(ClaimTypes.GivenName, user.FirstName));

			if (!string.IsNullOrWhiteSpace(user.LastName))
				claims.Add(new Claim(ClaimTypes.Surname, user.LastName));

			if (roles != null)
			{
				foreach (var role in roles)
				{
					claims.Add(new Claim(ClaimTypes.Role, role));
				}
			}

			var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSetting.PrivateKey));
			var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

			var token = new JwtSecurityToken(
				issuer: jwtSetting.Issuer,
				audience: jwtSetting.Audience,
				claims: claims,
				expires: DateTime.UtcNow.AddMinutes(jwtSetting.AccessTokenExpirationMinutes),
				signingCredentials: credentials
			);

			return new JwtSecurityTokenHandler().WriteToken(token);
		}

		public string GenerateRefreshToken()
		{
			var randomNumber = new byte[64];
			using var rng = RandomNumberGenerator.Create();
			rng.GetBytes(randomNumber);
			return Convert.ToBase64String(randomNumber);
		}

		public ClaimsPrincipal? ValidateToken(string token)
		{
			try
			{
				var jwtSetting = JwtSetting;
				var tokenHandler = new JwtSecurityTokenHandler();
				var key = Encoding.UTF8.GetBytes(jwtSetting.PrivateKey);

				var validationParameters = new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(key),
					ValidateIssuer = true,
					ValidIssuer = jwtSetting.Issuer,
					ValidateAudience = true,
					ValidAudience = jwtSetting.Audience,
					ValidateLifetime = true,
					ClockSkew = TimeSpan.Zero
				};

				var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
				return principal;
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Token validation failed");
				return null;
			}
		}

		/// <summary>
		/// Validates a token without checking expiration. Used for refresh token flow.
		/// </summary>
		public ClaimsPrincipal? ValidateExpiredToken(string token)
		{
			try
			{
				var jwtSetting = JwtSetting;
				var tokenHandler = new JwtSecurityTokenHandler();
				var key = Encoding.UTF8.GetBytes(jwtSetting.PrivateKey);

				var validationParameters = new TokenValidationParameters
				{
					ValidateIssuerSigningKey = true,
					IssuerSigningKey = new SymmetricSecurityKey(key),
					ValidateIssuer = true,
					ValidIssuer = jwtSetting.Issuer,
					ValidateAudience = true,
					ValidAudience = jwtSetting.Audience,
					ValidateLifetime = false, // Don't validate expiration
					ClockSkew = TimeSpan.Zero
				};

				var principal = tokenHandler.ValidateToken(token, validationParameters, out var securityToken);

				// Ensure the token is a JWT with the correct algorithm
				if (securityToken is not JwtSecurityToken jwtSecurityToken ||
				    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
				{
					_logger.LogWarning("Invalid token algorithm");
					return null;
				}

				return principal;
			}
			catch (Exception ex)
			{
				_logger.LogWarning(ex, "Expired token validation failed");
				return null;
			}
		}

		public TokenValidationResult ValidateTokenWithResult(string token)
		{
			var jwtSetting = JwtSetting;
			var tokenHandler = new JwtSecurityTokenHandler();
			var key = Encoding.UTF8.GetBytes(jwtSetting.PrivateKey);

			var validationParameters = new TokenValidationParameters
			{
				ValidateIssuerSigningKey = true,
				IssuerSigningKey = new SymmetricSecurityKey(key),
				ValidateIssuer = true,
				ValidIssuer = jwtSetting.Issuer,
				ValidateAudience = true,
				ValidAudience = jwtSetting.Audience,
				ValidateLifetime = true,
				ClockSkew = TimeSpan.Zero
			};

			return tokenHandler.ValidateTokenAsync(token, validationParameters).Result;
		}
	}
}
