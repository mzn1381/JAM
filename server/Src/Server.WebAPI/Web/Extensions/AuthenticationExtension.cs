using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Config;
using System.Text;
using System.Text.Json;

namespace Server.WebAPI.Web.Extensions
{
	public static class AuthenticationExtension
	{
		public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, ServerSetting serverSetting)
		{
			var jwtSetting = serverSetting.Jwt;

			services.AddAuthentication(options =>
			{
				options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
				options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
			})
			.AddJwtBearer(options =>
			{
				options.TokenValidationParameters = new TokenValidationParameters
				{
					ValidateIssuer = true,
					ValidateAudience = true,
					ValidateLifetime = true,
					ValidateIssuerSigningKey = true,
					ValidIssuer = jwtSetting.Issuer,
					ValidAudience = jwtSetting.Audience,
					IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSetting.PrivateKey)),
					ClockSkew = TimeSpan.Zero
				};

				options.Events = new JwtBearerEvents
				{
					OnAuthenticationFailed = context =>
					{
						if (context.Exception is SecurityTokenExpiredException)
						{
							context.Response.Headers.Append("Token-Expired", "true");
						}
						return Task.CompletedTask;
					},
					OnChallenge = async context =>
					{
						if (context.Response.HasStarted)
						{
							return;
						}

						context.HandleResponse();

						context.Response.StatusCode = StatusCodes.Status401Unauthorized;
						context.Response.ContentType = "application/json";

						var message = context.AuthenticateFailure is SecurityTokenExpiredException
							? "Token has expired"
							: "Unauthorized";

						var response = new ServiceResponse<bool>
						{
							Success = false,
							Data = false,
							Message = message,
							ErrorCode = ErrorCode.Unauthorized
						};

						var jsonOptions = new JsonSerializerOptions
						{
							PropertyNamingPolicy = JsonNamingPolicy.CamelCase
						};

						await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
					}
				};
			});

			services.AddAuthorization();

			return services;
		}
	}
}
