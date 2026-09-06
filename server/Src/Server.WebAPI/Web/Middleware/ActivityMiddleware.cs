using System.Diagnostics;

namespace Server.WebAPI.Web.Middleware
{
	/// <summary>
	/// Middleware to ensure an Activity is started for each request.
	/// This ensures TraceId is available even when OpenTelemetry is disabled.
	/// </summary>
	public class ActivityMiddleware
	{
		private readonly RequestDelegate _next;
		private readonly ILogger<ActivityMiddleware> _logger;
		private static readonly ActivitySource ActivitySource = new("Server.WebAPI");

		public ActivityMiddleware(RequestDelegate next, ILogger<ActivityMiddleware> logger)
		{
			_next = next;
			_logger = logger;
		}

		public async Task InvokeAsync(HttpContext context)
		{
			// If there's no current activity, start one
			if (Activity.Current == null)
			{
				using var activity = ActivitySource.StartActivity(
					$"{context.Request.Method} {context.Request.Path}",
					ActivityKind.Server);

				if (activity != null)
				{
					// Add useful tags to the activity
					activity.SetTag("http.method", context.Request.Method);
					activity.SetTag("http.url", context.Request.Path.ToString());
					activity.SetTag("http.host", context.Request.Host.ToString());
					
					if (context.Request.QueryString.HasValue)
					{
						activity.SetTag("http.query_string", context.Request.QueryString.ToString());
					}

					// Add TraceId to response headers for debugging
					context.Response.OnStarting(() =>
					{
						context.Response.Headers["X-Trace-Id"] = activity.TraceId.ToString();
						return Task.CompletedTask;
					});

					_logger.LogDebug("Started activity with TraceId: {TraceId}", activity.TraceId);
				}

				await _next(context);

				// Set status code tag after request completes
				activity?.SetTag("http.status_code", context.Response.StatusCode);
			}
			else
			{
				// Activity already exists (from OpenTelemetry), add TraceId to response
				context.Response.OnStarting(() =>
				{
					context.Response.Headers["X-Trace-Id"] = Activity.Current?.TraceId.ToString() ?? "";
					return Task.CompletedTask;
				});

				await _next(context);
			}
		}
	}

	/// <summary>
	/// Extension method to register the Activity middleware
	/// </summary>
	public static class ActivityMiddlewareExtensions
	{
		public static IApplicationBuilder UseActivityMiddleware(this IApplicationBuilder app)
		{
			return app.UseMiddleware<ActivityMiddleware>();
		}
	}
}
