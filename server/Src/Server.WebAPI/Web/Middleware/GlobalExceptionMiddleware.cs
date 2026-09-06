using System.Diagnostics;
using System.Net;
using System.Text.Json;
using Server.WebAPI.Common.Logging;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Models.SystemLogs;

namespace Server.WebAPI.Web.Middleware
{
	public class GlobalExceptionMiddleware
	{
		private readonly RequestDelegate _next;
		private readonly ILogger<GlobalExceptionMiddleware> _logger;

		public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
		{
			_next = next;
			_logger = logger;
		}

		public async Task InvokeAsync(HttpContext context, IExceptionLogService exceptionLogService)
		{
			try
			{
				await _next(context);
			}
			catch (Exception ex)
			{
				var traceId = Activity.Current?.TraceId.ToString();
				var spanId = Activity.Current?.SpanId.ToString();
				
				_logger.LogError(ex, "An unhandled exception occurred. TraceId: {TraceId}, SpanId: {SpanId}, Message: {Message}", 
					traceId, spanId, ex.Message);
				
				await HandleExceptionAsync(context, ex, exceptionLogService);
			}
		}

		private async Task HandleExceptionAsync(HttpContext context, Exception exception, IExceptionLogService exceptionLogService)
		{
			var statusCode = GetStatusCode(exception);
			
			// Capture trace information for the response
			var traceId = Activity.Current?.TraceId.ToString();
			
			var response = new ServiceResponse<object>
			{
				Success = false,
				Message = exception.Message + GetUserFriendlyMessage(exception, statusCode),
				Data = null,
			};

			// Log exception to MongoDB with trace information
			var exceptionLog = await CreateExceptionLogAsync(context, exception);
			await exceptionLogService.LogExceptionAsync(exceptionLog);

			context.Response.ContentType = "application/json";
			context.Response.StatusCode = (int)statusCode;

			var jsonOptions = new JsonSerializerOptions
			{
				PropertyNamingPolicy = JsonNamingPolicy.CamelCase
			};

			var jsonResponse = JsonSerializer.Serialize(response, jsonOptions);
			await context.Response.WriteAsync(jsonResponse);
		}

		private static HttpStatusCode GetStatusCode(Exception exception)
		{
			return exception switch
			{
				ArgumentNullException => HttpStatusCode.BadRequest,
				ArgumentException => HttpStatusCode.BadRequest,
				InvalidOperationException => HttpStatusCode.BadRequest,
				KeyNotFoundException => HttpStatusCode.NotFound,
				UnauthorizedAccessException => HttpStatusCode.Unauthorized,
				NotImplementedException => HttpStatusCode.NotImplemented,
				TimeoutException => HttpStatusCode.RequestTimeout,
				OperationCanceledException => HttpStatusCode.RequestTimeout,
				_ => HttpStatusCode.InternalServerError
			};
		}

		private static string GetUserFriendlyMessage(Exception exception, HttpStatusCode statusCode)
		{
			return statusCode switch
			{
				HttpStatusCode.BadRequest => exception.Message,
				HttpStatusCode.NotFound => exception.Message,
				HttpStatusCode.Unauthorized => "You are not authorized to perform this action.",
				HttpStatusCode.NotImplemented => "This feature is not yet implemented.",
				HttpStatusCode.RequestTimeout => "The request timed out. Please try again.",
				HttpStatusCode.InternalServerError => "An unexpected error occurred. Please try again later.",
				_ => "An error occurred while processing your request."
			};
		}

		private async Task<ExceptionLog> CreateExceptionLogAsync(HttpContext context, Exception exception)
		{
			string? requestBody = null;

			// Try to read the request body if it's rewindable
			if (context.Request.Body.CanSeek)
			{
				context.Request.Body.Position = 0;
				using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
				requestBody = await reader.ReadToEndAsync();
				context.Request.Body.Position = 0;
			}

			// Capture current activity trace information
			var currentActivity = Activity.Current;

			return new ExceptionLog
			{
				Id = Guid.NewGuid(),
				Message = exception.Message,
				StackTrace = exception.StackTrace,
				Source = exception.Source,
				ExceptionType = exception.GetType().FullName ?? exception.GetType().Name,
				InnerException = exception.InnerException?.ToString(),
				RequestPath = context.Request.Path,
				RequestMethod = context.Request.Method,
				QueryString = context.Request.QueryString.ToString(),
				RequestBody = requestBody,
				UserId = context.User?.Identity?.Name,
				IpAddress = context.Connection.RemoteIpAddress?.ToString(),
				UserAgent = context.Request.Headers.UserAgent.ToString(),
				TraceId = currentActivity?.TraceId.ToString(),
				SpanId = currentActivity?.SpanId.ToString(),
				ParentSpanId = currentActivity?.ParentSpanId.ToString(),
				CreatedAt = DateTime.UtcNow,
				UpdatedAt = DateTime.UtcNow
			};
		}
	}

	// Extension method to register the middleware
	public static class GlobalExceptionMiddlewareExtensions
	{
		public static IApplicationBuilder UseGlobalExceptionMiddleware(this IApplicationBuilder app)
		{
			return app.UseMiddleware<GlobalExceptionMiddleware>();
		}
	}
}
