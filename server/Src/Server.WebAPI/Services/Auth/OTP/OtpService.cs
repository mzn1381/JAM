using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Common.Results;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Auth;

namespace Server.WebAPI.Services.Auth.OTP
{
	public class SendOTPResult
	{
		public bool ShouldWait { get; set; }
		public int ExpiresInSeconds { get; set; }
		public int WaitInSeconds { get; set; }
	}

	public class VerifyOTPResult
	{
		public bool Verified { get; set; } = false;
		public bool Expired { get; set; } = false;
	}

	public interface IOTPService : IScopedService
	{
		Task<ResultFunction<SendOTPResult>> SendSMSOTP(string destination, CancellationToken cancellationToken = default);
		Task<ResultFunction<VerifyOTPResult>> VerifySMSOTP(string destination, string code, CancellationToken cancellationToken = default);

		(string Code, string Hash) GenerateOtp(int length);
	}

	public class OTPService : IOTPService
	{
		private readonly ServerDbContext _serverDbContext;
		private readonly IPasswordHasher _passwordHasher;
		private readonly ServerSetting _serverSetting;
		private readonly ILogger<OTPService> _logger;
		private readonly IHttpClientFactory _httpClientFactory;

		public OTPService(ServerDbContext serverDbContext,
			IPasswordHasher passwordHasher,
			IOptionsMonitor<ServerSetting> optionsMonitor,
			ILogger<OTPService> logger,
			IHttpClientFactory httpClientFactory)
		{
			_serverDbContext = serverDbContext;
			_passwordHasher = passwordHasher;
			_serverSetting = optionsMonitor.CurrentValue;
			_logger = logger;
			_httpClientFactory = httpClientFactory;
		}

		public async Task<ResultFunction<SendOTPResult>> SendSMSOTP(string destination, CancellationToken cancellationToken = default)
		{
			var otpSetting = _serverSetting.Login.Otp;

			var recent = await _serverDbContext.OtpVerifications
				.Where(o => o.Destination == destination && !o.IsUsed)
				.OrderByDescending(o => o.CreatedAt)
				.FirstOrDefaultAsync(cancellationToken);

			if(recent != null)
			{
				var elapsed = (DateTime.UtcNow - recent.CreatedAt).TotalSeconds;
				if(elapsed < otpSetting.ResendCooldownSeconds)
				{
					var wait = (int)Math.Ceiling(otpSetting.ResendCooldownSeconds - elapsed);

					return ResultFunctionHelper.Success(new SendOTPResult()
					{
						ShouldWait = true,
						WaitInSeconds = wait
					});
				}
			}

			var (code, hash) = GenerateOtp(otpSetting.CodeLength);

			var otp = new OtpVerification
			{
				Destination = destination,
				CodeHash = hash,
				ExpiresAt = DateTime.UtcNow.AddSeconds(otpSetting.ExpirationSeconds)
			};

			// check ASPNETCORE_ENVIRONMENT to avoid store rawcode in development environment
			if(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
			{
				otp.RawCode = code;
				_logger.LogInformation("Generated OTP for {Destination}: {Code} (This should not be logged in production)", destination, code);
			}

			_serverDbContext.OtpVerifications.Add(otp);
			await _serverDbContext.SaveChangesAsync(cancellationToken);

			Task.Run(async () =>
			{
				try
				{
					await SendSMS(destination, code);
				}
				catch(Exception ex)
				{
					_logger.LogError(ex, "Failed to send SMS to {Destination}", destination);
				}
			}, cancellationToken);
			//if(sendSMSResult.IsSuccessful == false)
			//{
			//	return ResultFunctionHelper.Error<SendOTPResult>(new(), "Failed to send OTP. Please try again later.");
			//}

			_logger.LogInformation("OTP generated for {Destination} (replace with real sending in production)", destination);

			return ResultFunctionHelper.Success(new SendOTPResult()
			{
				ShouldWait = false,
				ExpiresInSeconds = otpSetting.ExpirationSeconds
			});
		}

		public async Task<ResultFunction<VerifyOTPResult>> VerifySMSOTP(string destination, string code, CancellationToken cancellationToken = default)
		{
			var otpSetting = _serverSetting.Login.Otp;

			var otp = await _serverDbContext.OtpVerifications
				.Where(o => o.Destination == destination && !o.IsUsed)
				.OrderByDescending(o => o.CreatedAt)
				.FirstOrDefaultAsync(cancellationToken);

			if(otp == null)
			{
				return ResultFunctionHelper.Success(new VerifyOTPResult()
				{
					Verified = false,
					Expired = false,
				}, "Invalid verification code");
			}

			// expired code
			if(otp.ExpiresAt < DateTime.UtcNow)
			{
				otp.IsUsed = true;
				await _serverDbContext.SaveChangesAsync(cancellationToken);
				return ResultFunctionHelper.Success(new VerifyOTPResult()
				{
					Verified = false,
					Expired = true,
				}, "Verification code has expired. Please request a new one");
			}

			if(otp.Attempts >= otpSetting.MaxAttempts)
			{
				otp.IsUsed = true;
				await _serverDbContext.SaveChangesAsync(cancellationToken);

				return ResultFunctionHelper.Success(new VerifyOTPResult()
				{
					Verified = false,
					Expired = false,
				}, "Too many attempts. Please request a new code");
			}

			otp.Attempts++;

			if(VerifyOtp(code, otp.CodeHash) == false)
			{
				await _serverDbContext.SaveChangesAsync(cancellationToken);
				return ResultFunctionHelper.Success(new VerifyOTPResult() 
				{ 
					Verified = false, 
					Expired = false, 
				}, "Invalid verification code");
			}

			otp.IsUsed = true;
			await _serverDbContext.SaveChangesAsync(cancellationToken);

			return ResultFunctionHelper.Success(new VerifyOTPResult()
			{
				Verified = true,
				Expired = false,
			});
		}

		/// <summary>
		/// Method to send the OTP code to the user's phone number. In production, this should integrate with an SMS gateway service.
		/// </summary>
		private async Task<ResultFunction> SendSMS(string mobile, string code)
		{
			var smsSetting = _serverSetting.Login.Otp.Sms;

			try
			{
				var client = _httpClientFactory.CreateClient();
				var requestUrl = $"{smsSetting.BaseUrl.TrimEnd('/')}{smsSetting.OtpEndpoint}";

				var requestBody = new
				{
					code,
					mobile,
					template = smsSetting.Template
				};

				var content = new StringContent(
					JsonSerializer.Serialize(requestBody),
					Encoding.UTF8,
					"application/json");

				client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", smsSetting.AuthToken);

				var response = await client.PostAsync(requestUrl, content);

				if (response.IsSuccessStatusCode)
				{
					_logger.LogInformation("SMS OTP sent successfully to {Mobile}", mobile);
					return ResultFunctionHelper.Success();
				}

				var responseContent = await response.Content.ReadAsStringAsync();
				_logger.LogWarning("Failed to send SMS OTP to {Mobile}. Status: {StatusCode}, Response: {Response}",
					mobile, response.StatusCode, responseContent);

				return ResultFunctionHelper.Error($"SMS provider returned status code: {response.StatusCode}");
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Exception occurred while sending SMS OTP to {Mobile}", mobile);
				return ResultFunctionHelper.Error("Failed to send SMS due to an internal error");
			}
		}

		/// <summary>
		/// Verifies a raw OTP code against its stored hash.
		/// </summary>
		private bool VerifyOtp(string code, string hash)
		{
			return _passwordHasher.VerifyPassword(code, hash);
		}

		/// <summary>
		/// Generates a numeric OTP code and returns both the raw code and its hash.
		/// </summary>
		public (string Code, string Hash) GenerateOtp(int length)
		{
			var code = string.Create(length, (object?)null, static (span, _) =>
			{
				var bytes = System.Security.Cryptography.RandomNumberGenerator.GetBytes(span.Length);
				for(var i = 0; i < span.Length; i++)
					span[i] = (char)('0' + (bytes[i] % 10));
			});

			var hash = _passwordHasher.HashPassword(code);
			return (code, hash);
		}
	}
}
