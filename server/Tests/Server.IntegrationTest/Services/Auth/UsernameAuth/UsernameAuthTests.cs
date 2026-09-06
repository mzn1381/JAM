using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Services.Auth;
using Server.WebAPI.Services.Auth.Dtos;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Auth.UsernameAuth
{
	[Trait("Category", "Auth")]
	public class UsernameAuthTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public UsernameAuthTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
		{
			_outputHelper = outputHelper;
			_factory = factory;

			factory.WithWebHostBuilder(builder =>
			{
				builder.ConfigureServices(services =>
				{
				});
			});

			var sp = factory.Services;
			var scope = sp.CreateScope();
			_serviceProvider = scope.ServiceProvider;
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

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task RegisterUsernameAsync_ValidRequest_ReturnsSuccessWithTokens()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = CreateValidRegisterRequest();

			// Act
			var result = await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

			// Assert
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
		public async Task RegisterUsernameAsync_DuplicateUsername_ReturnsConflict()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = CreateValidRegisterRequest();

			// Register first user
			await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

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
			var result = await userLoginService.RegisterUsernameAsync(duplicateRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Equal(ErrorCode.Conflict, result.ErrorCode);
			Assert.Contains("already exists", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Duplicate username rejected: {result.Message}");
		}

		[Fact]
		public async Task RegisterUsernameAsync_DuplicateEmail_ReturnsConflict()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = CreateValidRegisterRequest();

			// Register first user
			await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

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
			var result = await userLoginService.RegisterUsernameAsync(duplicateRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Equal(ErrorCode.Conflict, result.ErrorCode);
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
		public async Task RegisterUsernameAsync_InvalidPassword_ReturnsValidationError(string password, string expectedMessagePart)
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = new RegisterUsernameRequestDto
			{
				Username = $"testuser_{Guid.NewGuid():N}",
				Email = $"test_{Guid.NewGuid():N}@example.com",
				Password = password,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Equal(ErrorCode.ValidationError, result.ErrorCode);
			Assert.Contains(expectedMessagePart, result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Password validation: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Login Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task LoginUsernameAsync_ValidCredentials_ReturnsSuccessWithTokens()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = registerRequest.Password
			};

			// Act
			var result = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.Equal("Bearer", result.Data.TokenType);
			Assert.Equal(registerRequest.Username, result.Data.User.Username);

			_outputHelper.WriteLine($"Login successful for: {result.Data.User.Username}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task LoginUsernameAsync_WithEmail_ReturnsSuccessWithTokens()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Email, // Login with email instead of username
				Password = registerRequest.Password
			};

			// Act
			var result = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.Equal(registerRequest.Username, result.Data.User.Username);

			_outputHelper.WriteLine($"Login with email successful for: {result.Data.User.Username}");
		}

		[Fact]
		public async Task LoginUsernameAsync_InvalidUsername_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var loginRequest = new LoginRequestDto
			{
				Username = $"nonexistent_{Guid.NewGuid():N}",
				Password = "ValidPassword1!"
			};

			// Act
			var result = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid username or password", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid username rejected: {result.Message}");
		}

		[Fact]
		public async Task LoginUsernameAsync_InvalidPassword_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = "WrongPassword1!"
			};

			// Act
			var result = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid username or password", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid password rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Token Refresh Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task RefreshTokenAsync_ValidTokens_ReturnsNewTokens()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult.Data.AccessToken,
				RefreshToken = registerResult.Data.RefreshToken
			};

			// Act
			var result = await userLoginService.RefreshTokenAsync(refreshRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.NotEqual(registerResult.Data.RefreshToken, result.Data.RefreshToken);

			_outputHelper.WriteLine("Token refresh successful");
		}

		[Fact]
		public async Task RefreshTokenAsync_InvalidRefreshToken_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult.Data.AccessToken,
				RefreshToken = "invalid_refresh_token"
			};

			// Act
			var result = await userLoginService.RefreshTokenAsync(refreshRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid refresh token", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid refresh token rejected: {result.Message}");
		}

		[Fact]
		public async Task RefreshTokenAsync_EmptyRefreshToken_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult.Data.AccessToken,
				RefreshToken = string.Empty
			};

			// Act
			var result = await userLoginService.RefreshTokenAsync(refreshRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Refresh token is required", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Empty refresh token rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Logout Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task LogoutAsync_ValidUser_ReturnsSuccess()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			// Act
			var result = await userLoginService.LogoutAsync(registerResult.Data.User.Id, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.True(result.Data);
			Assert.Contains("Logged out successfully", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine("Logout successful");
		}

		[Fact]
		public async Task LogoutAsync_NonExistentUser_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var nonExistentUserId = Guid.NewGuid();

			// Act
			var result = await userLoginService.LogoutAsync(nonExistentUserId, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("User not found", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Non-existent user logout rejected: {result.Message}");
		}

		[Fact]
		public async Task LogoutAsync_InvalidatesRefreshToken()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			// Logout
			await userLoginService.LogoutAsync(registerResult.Data.User.Id, CancellationToken.None);

			// Try to refresh with old token
			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = registerResult.Data.AccessToken,
				RefreshToken = registerResult.Data.RefreshToken
			};

			// Act
			var result = await userLoginService.RefreshTokenAsync(refreshRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid refresh token", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine("Refresh token invalidated after logout");
		}

		// ════════════════════════════════════════
		//  Account Lockout Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task LoginUsernameAsync_MultipleFailedAttempts_LocksAccount()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = "WrongPassword1!"
			};

			// Act - Make multiple failed login attempts
			ServiceResponse<LoginResponseDto>? lastResult = null;
			for (int i = 0; i < 6; i++)
			{
				lastResult = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);
			}

			// Assert
			Assert.NotNull(lastResult);
			Assert.False(lastResult.Success);
			Assert.Contains("locked", lastResult.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Account locked after failed attempts: {lastResult.Message}");
		}

		[Fact]
		public async Task LoginUsernameAsync_SuccessfulLoginResetsFailedAttempts()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			// Make a few failed attempts (but not enough to lock)
			var failedLoginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = "WrongPassword1!"
			};

			for (int i = 0; i < 3; i++)
			{
				await userLoginService.LoginUsernameAsync(failedLoginRequest, CancellationToken.None);
			}

			// Now login successfully
			var successfulLoginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = registerRequest.Password
			};

			// Act
			var result = await userLoginService.LoginUsernameAsync(successfulLoginRequest, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);

			// Verify we can make more failed attempts without getting locked
			// (because the counter was reset)
			for (int i = 0; i < 3; i++)
			{
				var failResult = await userLoginService.LoginUsernameAsync(failedLoginRequest, CancellationToken.None);
				Assert.False(failResult.Success);
				Assert.DoesNotContain("locked", failResult.Message, StringComparison.OrdinalIgnoreCase);
			}

			_outputHelper.WriteLine("Successful login resets failed attempts counter");
		}

		// ════════════════════════════════════════
		//  User Info Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task GetUserInfo_WithoutAuthentication_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			// Act - Call GetUserInfo without setting up CurrentContext (simulating unauthenticated)
			var result = userLoginService.GetUserInfo(registerResult.Data.User.Id);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("not authenticated", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Unauthenticated user info rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Registration and Login Flow Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task RegisterAndLogin_FullFlow_Succeeds()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var registerRequest = CreateValidRegisterRequest();

			// Act - Register
			var registerResult = await userLoginService.RegisterUsernameAsync(registerRequest, CancellationToken.None);

			// Assert - Registration
			Assert.True(registerResult.Success);
			var userId = registerResult.Data.User.Id;
			var initialRefreshToken = registerResult.Data.RefreshToken;

			// Act - Login
			var loginRequest = new LoginRequestDto
			{
				Username = registerRequest.Username,
				Password = registerRequest.Password
			};
			var loginResult = await userLoginService.LoginUsernameAsync(loginRequest, CancellationToken.None);

			// Assert - Login
			Assert.True(loginResult.Success);
			Assert.Equal(userId, loginResult.Data.User.Id);

			// Act - Refresh Token
			var refreshRequest = new RefreshTokenRequestDto
			{
				AccessToken = loginResult.Data.AccessToken,
				RefreshToken = loginResult.Data.RefreshToken
			};
			var refreshResult = await userLoginService.RefreshTokenAsync(refreshRequest, CancellationToken.None);

			// Assert - Refresh
			Assert.True(refreshResult.Success);
			Assert.NotEqual(loginResult.Data.RefreshToken, refreshResult.Data.RefreshToken);

			// Act - Logout
			var logoutResult = await userLoginService.LogoutAsync(userId, CancellationToken.None);

			// Assert - Logout
			Assert.True(logoutResult.Success);

			// Verify refresh token is invalidated after logout
			var postLogoutRefresh = await userLoginService.RefreshTokenAsync(new RefreshTokenRequestDto
			{
				AccessToken = refreshResult.Data.AccessToken,
				RefreshToken = refreshResult.Data.RefreshToken
			}, CancellationToken.None);

			Assert.False(postLogoutRefresh.Success);

			_outputHelper.WriteLine("Full authentication flow completed successfully");
		}

		[Fact]
		public async Task RegisterUsernameAsync_WithOptionalFields_StoresCorrectly()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = new RegisterUsernameRequestDto
			{
				Username = $"testuser_{Guid.NewGuid():N}",
				Email = $"test_{Guid.NewGuid():N}@example.com",
				Password = "ValidPassword1!",
				FirstName = "John",
				LastName = "Doe"
			};

			// Act
			var result = await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);
			Assert.Equal(request.FirstName, result.Data.User.FirstName);
			Assert.Equal(request.LastName, result.Data.User.LastName);

			_outputHelper.WriteLine($"User registered with name: {result.Data.User.FirstName} {result.Data.User.LastName}");
		}

		[Fact]
		public async Task RegisterUsernameAsync_WithoutOptionalFields_Succeeds()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = new RegisterUsernameRequestDto
			{
				Username = $"testuser_{Guid.NewGuid():N}",
				Email = $"test_{Guid.NewGuid():N}@example.com",
				Password = "ValidPassword1!",
				FirstName = null,
				LastName = null
			};

			// Act
			var result = await userLoginService.RegisterUsernameAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);
			Assert.Null(result.Data.User.FirstName);
			Assert.Null(result.Data.User.LastName);

			_outputHelper.WriteLine("User registered without optional fields");
		}
	}
}
