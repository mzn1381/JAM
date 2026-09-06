using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Server.WebAPI.Config;

namespace Server.WebAPI.Web.Extensions
{
	public static class OpenTelemetryExtensions
	{
		public static IServiceCollection AddOpenTelemetryTracing(this IServiceCollection services, ServerSetting serverSetting)
		{
			ArgumentNullException.ThrowIfNull(services);
			ArgumentNullException.ThrowIfNull(serverSetting);

			if (!serverSetting.OpenTelemetry.Enabled)
			{
				return services;
			}

			var otel = services.AddOpenTelemetry()
				.ConfigureResource(resource => resource
					.AddService(serverSetting.OpenTelemetry.ServiceName));

			if (serverSetting.OpenTelemetry.Tracing)
			{
				otel.WithTracing(tracing =>
				{
					tracing.AddAspNetCoreInstrumentation(options =>
					{
						options.RecordException = true;
					})
					.AddHttpClientInstrumentation(options =>
					{
						options.RecordException = true;
					});

					// Add custom sources if configured
					foreach (var source in serverSetting.OpenTelemetry.Sources)
					{
						tracing.AddSource(source);
					}

					// Export to Jaeger via OTLP
					tracing.AddOtlpExporter(options =>
					{
						options.Endpoint = new Uri(serverSetting.Jaeger.Url);
					});
				});
			}

			return services;
		}
	}
}
