using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Auth.Dtos;
using System.Net;
using System.Net.Http.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Auth.UsernameAuth
{
	[Trait("Category", "Auth")]
	public class UsernameAuthAPITests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly HttpClient _client;

		public UsernameAuthAPITests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
		{
			_outputHelper = outputHelper;
			_factory = factory;
			_client = factory.CreateClient();
		}

		private static RegisterUsernameRequestDto CreateValidRegisterRequest(string? suffix = null)
		{
			var uniqueId = suffix ?? Guid.NewGuid().ToString("N")[..8];
			return new RegisterUsernameRequestDto
			{
				Username = $"testuser_{uniqueId}",
				Email = $"testuser_{uniqueId}@example.com",
				Password = "ValidPassword1!",
				FirstName = "Test",
				LastName = "User"
			};
		}

		// ════════════════════════════════════════
		//  Register Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task RegisterUsername_ValidRequest_ReturnsSuccessWithTokens()
		{
			// Arrange
			var request = CreateValidRegisterRequest();

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/register-username", request);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.Equal("Bearer", result.Data.TokenType);
			Assert.True(result.Data.ExpiresIn > 0);
			Assert.Equal(request.Username, result.Data.User.Username);
			Assert.Equal(request.Email, result.Data.User.Email);

			_outputHelper.WriteLine($"Registered user: {result.Data.User.Username}");
		}

		[Fact]
		public async Task RegisterUsername_DuplicateUsername_ReturnsDuplicated()
		{
			// Arrange
			var request = CreateValidRegisterRequest();

			// Register first user
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", request);

			// Attempt to register with same username but different email
			var duplicateRequest = new RegisterUsernameRequestDto
			{
				Username = request.Username,
				Email = $"different_{Guid.NewGuid():N}@example.com",
				Password = "ValidPassword1!",
				FirstName = "Another",
				LastName = "User"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/register-username", duplicateRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("already exists", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Duplicate username rejected: {result.Message}");
		}

		[Fact]
		public async Task RegisterUsername_DuplicateEmail_ReturnsDuplicated()
		{
			// Arrange
			var request = CreateValidRegisterRequest();

			// Register first user
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", request);

			// Attempt to register with different username but same email
			var duplicateRequest = new RegisterUsernameRequestDto
			{
				Username = $"different_{Guid.NewGuid():N}",
				Email = request.Email,
				Password = "ValidPassword1!",
				FirstName = "Another",
				LastName = "User"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/register-username", duplicateRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("already exists", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Duplicate email rejected: {result.Message}");
		}

		[Theory]
		[InlineData("", "Password is required")]	
		[InlineData("short1!", "Password must be at least 8 characters")]
		[InlineData("alllowercase1!", "Password must contain at least one uppercase letter")]
		[InlineData("ALLUPPERCASE1!", "Password must contain at least one lowercase letter")]
		[InlineData("NoDigitsHere!", "Password must contain at least one digit")]
		[InlineData("NoSpecialChar1", "Password must contain at least one special character")]
		public async Task RegisterUsername_InvalidPassword_ReturnsValidationError(string password, string expectedMessagePart)
		{
			// Arrange
			var request = new RegisterUsernameRequestDto
			{
				Username = $"testuser_{Guid.NewGuid():N}",
				Email = $"test_{Guid.NewGuid():N}@example.com",
				Password = password,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/register-username", request);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains(expectedMessagePart, result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Password validation: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Login Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task LoginUsername_ValidCredentials_ReturnsSuccessWithTokens()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = registerRequest.Password
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/login-username", loginRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.Equal("Bearer", result.Data.TokenType);
			Assert.Equal(registerRequest.Username, result.Data.User.Username);

			_outputHelper.WriteLine($"Login successful for: {result.Data.User.Username}");
		}

		[Fact]
		public async Task LoginUsername_WithEmail_ReturnsSuccessWithTokens()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Email, // Login with email instead of username
				Password = registerRequest.Password
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/login-username", loginRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.Equal(registerRequest.Username, result.Data.User.Username);

			_outputHelper.WriteLine($"Login with email successful for: {result.Data.User.Username}");
		}

		[Fact]
		public async Task LoginUsername_InvalidUsername_ReturnsUnauthorized()
		{
			// Arrange
			var loginRequest = new LoginRequestDto
			{
				Username = $"nonexistent_{Guid.NewGuid():N}",
				Password = "ValidPassword1!"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/login-username", loginRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid username or password", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid username rejected: {result.Message}");
		}

		[Fact]
		public async Task LoginUsername_InvalidPassword_ReturnsUnauthorized()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = "WrongPassword1!"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/login-username", loginRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid username or password", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid password rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Token Refresh Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task RefreshToken_ValidTokens_ReturnsNewTokens()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);
			var registerResult = await registerResponse.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult!.Data.AccessToken,
				RefreshToken = registerResult.Data.RefreshToken
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.NotEqual(registerResult.Data.RefreshToken, result.Data.RefreshToken);

			_outputHelper.WriteLine("Token refresh successful");
		}

		[Fact]
		public async Task RefreshToken_InvalidRefreshToken_ReturnsUnauthorized()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);
			var registerResult = await registerResponse.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult!.Data.AccessToken,
				RefreshToken = "invalid_refresh_token"
			};

			// Act
			var response = await _client.PostAsJsonAsync("/api/v1/auth/refresh", refreshRequest);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);

			_outputHelper.WriteLine($"Invalid refresh token rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Logout Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task Logout_AuthenticatedUser_ReturnsSuccess()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);
			var registerResult = await registerResponse.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			_client.DefaultRequestHeaders.Authorization =
				new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", registerResult!.Data.AccessToken);

			// Act
			var response = await _client.PostAsync("/api/v1/auth/logout", null);
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<bool>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.True(result.Data);

			_outputHelper.WriteLine("Logout successful");

			// Cleanup
			_client.DefaultRequestHeaders.Authorization = null;
		}

		[Fact]
		public async Task Logout_UnauthenticatedUser_ReturnsUnauthorized()
		{
			// Act
			var response = await _client.PostAsync("/api/v1/auth/logout", null);

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

			_outputHelper.WriteLine("Unauthenticated logout rejected");
		}

		// ════════════════════════════════════════
		//  Identity User Info Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task GetIdentityUserInfo_AuthenticatedUser_ReturnsUserInfo()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);
			var registerResult = await registerResponse.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();

			_client.DefaultRequestHeaders.Authorization =
				new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", registerResult!.Data.AccessToken);

			// Act
			var response = await _client.GetAsync("/api/v1/auth/identity-user-info");
			var result = await response.Content.ReadFromJsonAsync<ServiceResponse<UserInfoDto>>();

			// Assert
			Assert.Equal(HttpStatusCode.OK, response.StatusCode);
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Equal(registerRequest.Username, result.Data.Username);
			Assert.Equal(registerRequest.Email, result.Data.Email);
			Assert.Equal(registerRequest.FirstName, result.Data.FirstName);
			Assert.Equal(registerRequest.LastName, result.Data.LastName);

			_outputHelper.WriteLine($"User info retrieved for: {result.Data.Username}");

			// Cleanup
			_client.DefaultRequestHeaders.Authorization = null;
		}

		[Fact]
		public async Task GetIdentityUserInfo_UnauthenticatedUser_ReturnsUnauthorized()
		{
			// Act
			var response = await _client.GetAsync("/api/v1/auth/identity-user-info");

			// Assert
			Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

			_outputHelper.WriteLine("Unauthenticated user info request rejected");
		}

		// ════════════════════════════════════════
		//  Account Lockout Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task LoginUsername_MultipleFailedAttempts_LocksAccount()
		{
			// Arrange
			var registerRequest = CreateValidRegisterRequest();
			await _client.PostAsJsonAsync("/api/v1/auth/register-username", registerRequest);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = "WrongPassword1!"
			};

			// Act - Make multiple failed login attempts
			ServiceResponse<LoginResponseDto>? lastResult = null;
			for(int i = 0; i < 6; i++)
			{
				var response = await _client.PostAsJsonAsync("/api/v1/auth/login-username", loginRequest);
				lastResult = await response.Content.ReadFromJsonAsync<ServiceResponse<LoginResponseDto>>();
			}

			// Assert
			Assert.NotNull(lastResult);
			Assert.False(lastResult.Success);
			Assert.Contains("locked", lastResult.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Account locked after failed attempts: {lastResult.Message}");
		}
	}
}
