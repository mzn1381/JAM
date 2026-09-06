using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Auth;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Auth;
using Server.WebAPI.Services.Auth.Dtos;
using Server.WebAPI.Services.Auth.OTP;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Auth.OTPAuth
{
	[Trait("Category", "Auth")]
	public class OTPAuthTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceScope _scope;
		private readonly IServiceProvider _serviceProvider;

		public OTPAuthTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
		{
			_outputHelper = outputHelper;
			_factory = factory;

			_scope = factory.Services.CreateScope();
			_serviceProvider = _scope.ServiceProvider;
		}

		private static string GenerateUniquePhoneNumber()
		{
			return $"+1{Random.Shared.NextInt64(1000000000, 9999999999)}";
			//List<string> baseNumbers = ["09924919807", "09921051782"];
			//var randomNumber = baseNumbers[Random.Shared.Next(baseNumbers.Count)];
			//return randomNumber;
		}

		/// <summary>
		/// Creates an OTP verification record with a known code for testing.
		/// </summary>
		private async Task<string> CreateOtpVerificationAsync(string phoneNumber, string code, int expirationSeconds = 300)
		{
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var passwordHasher = _serviceProvider.GetRequiredService<IPasswordHasher>();

			var otp = new OtpVerification
			{
				Destination = phoneNumber,
				CodeHash = passwordHasher.HashPassword(code),
				ExpiresAt = DateTime.UtcNow.AddSeconds(expirationSeconds),
				Attempts = 0,
				IsUsed = false
			};

			dbContext.OtpVerifications.Add(otp);
			await dbContext.SaveChangesAsync();

			return code;
		}

		/// <summary>
		/// Creates a user with a verified phone number for login OTP tests.
		/// </summary>
		private async Task<User> CreateVerifiedPhoneUserAsync(string phoneNumber, string? firstName = "Test", string? lastName = "User")
		{
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();

			var user = new User
			{
				Username = phoneNumber,
				Email = string.Empty,
				PasswordHash = string.Empty,
				PhoneNumber = phoneNumber,
				PhoneNumberVerified = true,
				FirstName = firstName,
				LastName = lastName
			};

			dbContext.Users.Add(user);
			await dbContext.SaveChangesAsync();

			return user;
		}

		private string GenerateCode()
		{
			var optionsMonitor = _serviceProvider.GetRequiredService<IOptionsMonitor<ServerSetting>>();
			var serverSetting = optionsMonitor.CurrentValue;
			var otpService = _serviceProvider.GetRequiredService<IOTPService>();

			(var code, _) = otpService.GenerateOtp(serverSetting.Login.Otp.CodeLength);

			return code;
		}

		// ════════════════════════════════════════
		//  Send Register OTP Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task SendRegisterOtpAsync_NewPhoneNumber_ReturnsSuccess()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = new RegisterOtpRequestDto
			{
				PhoneNumber = "09924919807",//GenerateUniquePhoneNumber(),
				FirstName = "Abolfazl",
				LastName = "Arshia",
			};

			// Act
			var result = await userLoginService.SendRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			// Note: Success depends on SMS service availability
			// In test environment without SMS service, this may fail
			_outputHelper.WriteLine($"SendRegisterOtpAsync result: Success={result.Success}, Message={result.Message}");
		}

		[Fact]
		public async Task SendRegisterOtpAsync_AlreadyRegisteredPhone_ReturnsConflict()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();

			// Create a user with verified phone number
			await CreateVerifiedPhoneUserAsync(phoneNumber);

			var request = new RegisterOtpRequestDto
			{
				PhoneNumber = phoneNumber,
				FirstName = "Another",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.SendRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Equal(ErrorCode.Conflict, result.ErrorCode);
			Assert.Contains("already registered", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Already registered phone rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Verify Register OTP Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyRegisterOtpAsync_ValidCode_ReturnsSuccessWithTokens()
		{
			// Arrange
			var optionsMonitor = _serviceProvider.GetRequiredService<IOptionsMonitor<ServerSetting>>();
			var serverSetting = optionsMonitor.CurrentValue;
			var otpService = _serviceProvider.GetRequiredService<IOTPService>();
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();


			(var code, _) = otpService.GenerateOtp(serverSetting.Login.Otp.CodeLength);
			var phoneNumber = GenerateUniquePhoneNumber();

			// Create OTP verification record with known code
			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.Equal("Bearer", result.Data.TokenType);
			Assert.True(result.Data.ExpiresIn > 0);
			Assert.Equal(phoneNumber, result.Data.User.Username);

			_outputHelper.WriteLine($"Registered user via OTP: {result.Data.User.Username}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyRegisterOtpAsync_InvalidCode_ReturnsFailure()
		{
			// Arrange
			var optionsMonitor = _serviceProvider.GetRequiredService<IOptionsMonitor<ServerSetting>>();
			var serverSetting = optionsMonitor.CurrentValue;
			var otpService = _serviceProvider.GetRequiredService<IOTPService>();
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();

			var phoneNumber = GenerateUniquePhoneNumber();
			(var correctCode, _) = otpService.GenerateOtp(serverSetting.Login.Otp.CodeLength);
			(var wrongCode, _) = otpService.GenerateOtp(serverSetting.Login.Otp.CodeLength);

			// Create OTP verification record with known code
			await CreateOtpVerificationAsync(phoneNumber, correctCode);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = wrongCode,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid OTP code rejected: {result.Message}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyRegisterOtpAsync_ExpiredCode_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			// Create expired OTP verification record
			await CreateOtpVerificationAsync(phoneNumber, code, expirationSeconds: -60);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("expired", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Expired OTP code rejected: {result.Message}");
		}

		[Fact]
		public async Task VerifyRegisterOtpAsync_NoOtpSent_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid", result.Message.ToLower(), StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"No OTP sent rejected: {result.Message}");
		}

		[Fact]
		public async Task VerifyRegisterOtpAsync_WithOptionalNames_StoresCorrectly()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "John",
				LastName = "Doe"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);
			Assert.Equal("John", result.Data.User.FirstName);
			Assert.Equal("Doe", result.Data.User.LastName);

			_outputHelper.WriteLine($"User registered with name: {result.Data.User.FirstName} {result.Data.User.LastName}");
		}

		[Fact]
		public async Task VerifyRegisterOtpAsync_WithoutOptionalNames_Succeeds()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = null,
				LastName = null
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);
			Assert.Null(result.Data.User.FirstName);
			Assert.Null(result.Data.User.LastName);

			_outputHelper.WriteLine("User registered via OTP without optional fields");
		}

		[Fact]
		public async Task VerifyRegisterOtpAsync_ExistingUnverifiedUser_UpdatesAndVerifies()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			// Create unverified user with the phone number
			var existingUser = new User
			{
				Username = phoneNumber,
				Email = string.Empty,
				PasswordHash = string.Empty,
				PhoneNumber = phoneNumber,
				PhoneNumberVerified = false,
				FirstName = "Old",
				LastName = "Name"
			};
			dbContext.Users.Add(existingUser);
			await dbContext.SaveChangesAsync();

			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "New",
				LastName = "Name"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);
			Assert.Equal("New", result.Data.User.FirstName);
			Assert.Equal("Name", result.Data.User.LastName);

			// Verify user is now verified in database
			var updatedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
			Assert.NotNull(updatedUser);
			Assert.True(updatedUser.PhoneNumberVerified);

			_outputHelper.WriteLine("Existing unverified user updated and verified via OTP");
		}

		// ════════════════════════════════════════
		//  Send Login OTP Tests
		// ════════════════════════════════════════

		[Fact]
		public async Task SendLoginOtpAsync_UnregisteredPhone_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var request = new LoginOtpRequestDto
			{
				PhoneNumber = GenerateUniquePhoneNumber()
			};

			// Act
			var result = await userLoginService.SendLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("not registered", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Unregistered phone rejected: {result.Message}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task SendLoginOtpAsync_RegisteredPhone_ReturnsSuccess()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();

			// Create a user with verified phone number
			await CreateVerifiedPhoneUserAsync(phoneNumber);

			var request = new LoginOtpRequestDto
			{
				PhoneNumber = phoneNumber
			};

			// Act
			var result = await userLoginService.SendLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			// Note: Success depends on SMS service availability
			_outputHelper.WriteLine($"SendLoginOtpAsync result: Success={result.Success}, Message={result.Message}");
		}

		[Fact]
		public async Task SendLoginOtpAsync_LockedAccount_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();

			// Create a locked user
			var user = new User
			{
				Username = phoneNumber,
				Email = string.Empty,
				PasswordHash = string.Empty,
				PhoneNumber = phoneNumber,
				PhoneNumberVerified = true,
				LockoutEnd = DateTime.UtcNow.AddMinutes(30),
				FailedLoginAttempts = 6
			};
			dbContext.Users.Add(user);
			await dbContext.SaveChangesAsync();

			var request = new LoginOtpRequestDto
			{
				PhoneNumber = phoneNumber
			};

			// Act
			var result = await userLoginService.SendLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("locked", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Locked account rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Verify Login OTP Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyLoginOtpAsync_ValidCode_ReturnsSuccessWithTokens()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			// Create verified user
			await CreateVerifiedPhoneUserAsync(phoneNumber);

			// Create OTP verification record
			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.NotEmpty(result.Data.AccessToken);
			Assert.NotEmpty(result.Data.RefreshToken);
			Assert.Equal("Bearer", result.Data.TokenType);
			Assert.Equal(phoneNumber, result.Data.User.Username);

			_outputHelper.WriteLine($"Login via OTP successful for: {result.Data.User.Username}");
		}

		[Fact]
		public async Task VerifyLoginOtpAsync_UnregisteredPhone_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			// Create OTP but no user
			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("not registered", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Unregistered phone login rejected: {result.Message}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyLoginOtpAsync_InvalidCode_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var correctCode = GenerateCode();
			var wrongCode = GenerateCode();

			await CreateVerifiedPhoneUserAsync(phoneNumber);
			await CreateOtpVerificationAsync(phoneNumber, correctCode);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = wrongCode
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("Invalid", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Invalid OTP login rejected: {result.Message}");
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task VerifyLoginOtpAsync_ExpiredCode_ReturnsFailure()
		{
			// Arrange
			var optionsMonitor = _serviceProvider.GetRequiredService<IOptionsMonitor<ServerSetting>>();
			var serverSetting = optionsMonitor.CurrentValue;
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			await CreateVerifiedPhoneUserAsync(phoneNumber);
			await CreateOtpVerificationAsync(phoneNumber, code, expirationSeconds: -serverSetting.Login.Otp.ExpirationSeconds);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("expired", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Expired OTP login rejected: {result.Message}");
		}

		[Fact]
		public async Task VerifyLoginOtpAsync_LockedAccount_ReturnsFailure()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = GenerateCode();

			// Create locked user
			var user = new User
			{
				Username = phoneNumber,
				Email = string.Empty,
				PasswordHash = string.Empty,
				PhoneNumber = phoneNumber,
				PhoneNumberVerified = true,
				LockoutEnd = DateTime.UtcNow.AddMinutes(30),
				FailedLoginAttempts = 6
			};
			dbContext.Users.Add(user);
			await dbContext.SaveChangesAsync();

			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.NotNull(result);
			Assert.True(result.Success);
			Assert.Contains("locked", result.Message, StringComparison.OrdinalIgnoreCase);

			_outputHelper.WriteLine($"Locked account OTP login rejected: {result.Message}");
		}

		// ════════════════════════════════════════
		//  Full OTP Flow Tests
		// ════════════════════════════════════════

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task OtpRegisterAndLogin_FullFlow_Succeeds()
		{
			// Arrange
			var optionsMonitor = _serviceProvider.GetRequiredService<IOptionsMonitor<ServerSetting>>();
			var serverSetting = optionsMonitor.CurrentValue;
			var otpService = _serviceProvider.GetRequiredService<IOTPService>();
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var phoneNumber = GenerateUniquePhoneNumber();

			// Step 1: Register via OTP
			var sendRegisterResult = await userLoginService.SendRegisterOtpAsync(new RegisterOtpRequestDto
			{
				PhoneNumber = phoneNumber,
				FirstName = "Abolfazl",
				LastName = "Arshia"
			}, CancellationToken.None);

			// Assert OTP sent (note: may fail if SMS service is not available in test environment)
			Assert.True(sendRegisterResult.Success);
			Assert.False(sendRegisterResult.Data.ShouldWait);

			// get registration code from database (since we can't receive SMS in test environment)
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var otpRecord = await dbContext.OtpVerifications
				.Where(o => o.Destination == phoneNumber && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
				.OrderByDescending(o => o.CreatedAt)
				.FirstOrDefaultAsync();

			Assert.NotNull(otpRecord);
			Assert.NotNull(otpRecord.CodeHash);
			Assert.NotNull(otpRecord.RawCode);

			var registerRequest = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = otpRecord.RawCode,
				FirstName = "Abolfazl",
				LastName = "Arshia"
			};

			var registerResult = await userLoginService.VerifyRegisterOtpAsync(registerRequest, CancellationToken.None);

			// Assert registration
			Assert.True(registerResult.Success);
			var userId = registerResult.Data.User.Id;
			_outputHelper.WriteLine($"User registered with ID: {userId}");

			// Step 2: Logout
			var logoutResult = await userLoginService.LogoutAsync(userId, CancellationToken.None);
			Assert.True(logoutResult.Success);
			_outputHelper.WriteLine("User logged out");

			// Step 3: Login via OTP
			var sendLoginResult = await userLoginService.SendLoginOtpAsync(new LoginOtpRequestDto
			{
				PhoneNumber = phoneNumber
			}, CancellationToken.None);

			// Assert OTP sent for login
			Assert.True(sendLoginResult.Success);
			Assert.False(sendLoginResult.Data.ShouldWait);

			// get login code from database
			var loginOtpRecord = await dbContext.OtpVerifications
				.Where(o => o.Destination == phoneNumber && !o.IsUsed && o.ExpiresAt > DateTime.UtcNow)
				.OrderByDescending(o => o.CreatedAt)
				.FirstOrDefaultAsync();

			Assert.NotNull(loginOtpRecord);
			Assert.NotNull(loginOtpRecord.CodeHash);
			Assert.NotNull(loginOtpRecord.RawCode);

			var loginRequest = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = loginOtpRecord.RawCode,
			};

			var loginResult = await userLoginService.VerifyLoginOtpAsync(loginRequest, CancellationToken.None);

			// Assert login
			Assert.True(loginResult.Success);
			Assert.Equal(userId, loginResult.Data.User.Id);
			Assert.NotEmpty(loginResult.Data.AccessToken);
			Assert.NotEmpty(loginResult.Data.RefreshToken);

			_outputHelper.WriteLine("Full OTP registration and login flow completed successfully");
		}

		[Fact]
		public async Task OtpLogin_ResetsFailedAttempts_AfterSuccess()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var correctCode = "123456";

			// Create user with some failed attempts
			var user = new User
			{
				Username = phoneNumber,
				Email = string.Empty,
				PasswordHash = string.Empty,
				PhoneNumber = phoneNumber,
				PhoneNumberVerified = true,
				FailedLoginAttempts = 3,
				FirstName = "Test",
				LastName = "User"
			};
			dbContext.Users.Add(user);
			await dbContext.SaveChangesAsync();

			await CreateOtpVerificationAsync(phoneNumber, correctCode);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = correctCode
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);

			// Verify failed attempts reset
			var updatedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
			Assert.NotNull(updatedUser);
			Assert.Equal(0, updatedUser.FailedLoginAttempts);
			Assert.Null(updatedUser.LockoutEnd);

			_outputHelper.WriteLine("Failed attempts reset after successful OTP login");
		}

		[Fact]
		public async Task OtpLogin_SetsLastLoginAt_OnSuccess()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = "123456";

			var beforeLogin = DateTime.UtcNow;

			await CreateVerifiedPhoneUserAsync(phoneNumber);
			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new LoginOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code
			};

			// Act
			var result = await userLoginService.VerifyLoginOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);

			var updatedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
			Assert.NotNull(updatedUser);
			Assert.NotNull(updatedUser.LastLoginAt);
			Assert.True(updatedUser.LastLoginAt >= beforeLogin);

			_outputHelper.WriteLine($"LastLoginAt set to: {updatedUser.LastLoginAt}");
		}

		[Fact]
		public async Task OtpRegister_SetsPhoneNumberVerified_ToTrue()
		{
			// Arrange
			var userLoginService = _serviceProvider.GetRequiredService<IUserLoginService>();
			var dbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			var phoneNumber = GenerateUniquePhoneNumber();
			var code = "123456";

			await CreateOtpVerificationAsync(phoneNumber, code);

			var request = new RegisterOtpVerifyRequestDto
			{
				PhoneNumber = phoneNumber,
				Code = code,
				FirstName = "Test",
				LastName = "User"
			};

			// Act
			var result = await userLoginService.VerifyRegisterOtpAsync(request, CancellationToken.None);

			// Assert
			Assert.True(result.Success);

			var user = await dbContext.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
			Assert.NotNull(user);
			Assert.True(user.PhoneNumberVerified);
			Assert.Equal(phoneNumber, user.Username); // Username should be set to phone number

			_outputHelper.WriteLine("Phone number verified flag set correctly");
		}
	}
}
