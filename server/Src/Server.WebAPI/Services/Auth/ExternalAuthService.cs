using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.Auth;

namespace Server.WebAPI.Services.Auth
{
	public class ExternalUserInfo
	{
		public string ProviderId { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string? Username { get; set; }
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public interface IExternalAuthService : IScopedService
	{
		Task<ExternalUserInfo?> GetUserAsync(ExternalAuthProvider provider, string code, string? redirectUri, CancellationToken cancellationToken);
	}

	public class ExternalAuthService : IExternalAuthService
	{
		private readonly IHttpClientFactory _httpClientFactory;
		private readonly Config.GitHubAuthSetting _gitHubSetting;
		private readonly Config.GoogleAuthSetting _googleSetting;
		private readonly ILogger<ExternalAuthService> _logger;

		public ExternalAuthService(
			IHttpClientFactory httpClientFactory,
			Microsoft.Extensions.Options.IOptionsMonitor<Config.ServerSetting> optionsMonitor,
			ILogger<ExternalAuthService> logger)
		{
			_httpClientFactory = httpClientFactory;
			_gitHubSetting = optionsMonitor.CurrentValue.Login.GitHubAuth;
			_googleSetting = optionsMonitor.CurrentValue.Login.GoogleAuth;
			_logger = logger;
		}

		public Task<ExternalUserInfo?> GetUserAsync(ExternalAuthProvider provider, string code, string? redirectUri, CancellationToken cancellationToken)
		{
			return provider switch
			{
				ExternalAuthProvider.GitHub => GetGitHubUserAsync(code, redirectUri, cancellationToken),
				ExternalAuthProvider.Google => GetGoogleUserAsync(code, redirectUri, cancellationToken),
				_ => throw new ArgumentOutOfRangeException(nameof(provider), provider, "Unsupported external auth provider")
			};
		}

		private async Task<ExternalUserInfo?> GetGitHubUserAsync(string code, string? redirectUri, CancellationToken cancellationToken)
		{
			try
			{
				using var client = _httpClientFactory.CreateClient();

				// Exchange code for access token
				var tokenRequest = new HttpRequestMessage(HttpMethod.Post, "https://github.com/login/oauth/access_token");
				tokenRequest.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
				tokenRequest.Content = JsonContent.Create(new
				{
					client_id = _gitHubSetting.ClientId,
					client_secret = _gitHubSetting.ClientSecret,
					code,
					redirect_uri = redirectUri
				});

				var tokenResponse = await client.SendAsync(tokenRequest, cancellationToken);
				if (!tokenResponse.IsSuccessStatusCode)
				{
					_logger.LogWarning("GitHub token exchange failed with status {Status}", tokenResponse.StatusCode);
					return null;
				}

				var tokenJson = await tokenResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken);
				if (!tokenJson.TryGetProperty("access_token", out var accessTokenElement))
				{
					_logger.LogWarning("GitHub token response missing access_token");
					return null;
				}

				var accessToken = accessTokenElement.GetString();
				if (string.IsNullOrWhiteSpace(accessToken))
				{
					_logger.LogWarning("GitHub token response access_token is null or empty");
					return null;
				}

				// Fetch user profile
				var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user");
				userRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
				userRequest.Headers.UserAgent.ParseAdd("PishkarServer");

				var userResponse = await client.SendAsync(userRequest, cancellationToken);
				if (!userResponse.IsSuccessStatusCode)
				{
					_logger.LogWarning("GitHub user fetch failed with status {Status}", userResponse.StatusCode);
					return null;
				}

				var userJson = await userResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken);
				var id = userJson.GetProperty("id").GetInt64().ToString();
				var login = userJson.TryGetProperty("login", out var l) ? l.GetString() : null;
				var name = userJson.TryGetProperty("name", out var n) ? n.GetString() : null;
				var email = userJson.TryGetProperty("email", out var e) ? e.GetString() : null;

				// If email is not public, fetch from emails endpoint
				if (string.IsNullOrEmpty(email))
				{
					var emailRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.github.com/user/emails");
					emailRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
					emailRequest.Headers.UserAgent.ParseAdd("PishkarServer");

					var emailResponse = await client.SendAsync(emailRequest, cancellationToken);
					if (emailResponse.IsSuccessStatusCode)
					{
						var emails = await emailResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement[]>(cancellationToken);
						var primary = emails?.FirstOrDefault(em =>
							em.TryGetProperty("primary", out var p) && p.GetBoolean());
						email = primary?.GetProperty("email").GetString();
					}
				}

				string? firstName = null, lastName = null;
				if (!string.IsNullOrWhiteSpace(name))
				{
					var parts = name.Split(' ', 2, StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
					firstName = parts.Length > 0 ? parts[0] : null;
					lastName = parts.Length > 1 ? parts[1] : null;
				}

				return new ExternalUserInfo
				{
					ProviderId = id,
					Email = email ?? string.Empty,
					Username = login,
					FirstName = firstName,
					LastName = lastName
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to authenticate with GitHub");
				return null;
			}
		}

		private async Task<ExternalUserInfo?> GetGoogleUserAsync(string code, string? redirectUri, CancellationToken cancellationToken)
		{
			try
			{
				using var client = _httpClientFactory.CreateClient();

				// Exchange code for tokens
				var tokenRequest = new FormUrlEncodedContent(new Dictionary<string, string>
				{
					["code"] = code,
					["client_id"] = _googleSetting.ClientId,
					["client_secret"] = _googleSetting.ClientSecret,
					["redirect_uri"] = redirectUri ?? string.Empty,
					["grant_type"] = "authorization_code"
				});

				var tokenResponse = await client.PostAsync("https://oauth2.googleapis.com/token", tokenRequest, cancellationToken);
				if (!tokenResponse.IsSuccessStatusCode)
				{
					_logger.LogWarning("Google token exchange failed with status {Status}", tokenResponse.StatusCode);
					return null;
				}

				var tokenJson = await tokenResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken);
				if (!tokenJson.TryGetProperty("access_token", out var accessTokenElement))
				{
					_logger.LogWarning("Google token response missing access_token");
					return null;
				}

				var accessToken = accessTokenElement.GetString();

				// Fetch user profile
				var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v2/userinfo");
				userRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

				var userResponse = await client.SendAsync(userRequest, cancellationToken);
				if (!userResponse.IsSuccessStatusCode)
				{
					_logger.LogWarning("Google user fetch failed with status {Status}", userResponse.StatusCode);
					return null;
				}

				var userJson = await userResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken);
				var id = userJson.GetProperty("id").GetString() ?? string.Empty;
				var email = userJson.TryGetProperty("email", out var e) ? e.GetString() : null;
				var givenName = userJson.TryGetProperty("given_name", out var gn) ? gn.GetString() : null;
				var familyName = userJson.TryGetProperty("family_name", out var fn) ? fn.GetString() : null;

				return new ExternalUserInfo
				{
					ProviderId = id,
					Email = email ?? string.Empty,
					Username = email,
					FirstName = givenName,
					LastName = familyName
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to authenticate with Google");
				return null;
			}
		}
	}
}
