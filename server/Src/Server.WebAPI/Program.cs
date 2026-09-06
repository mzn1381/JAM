using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Common.Context;
using Server.WebAPI.Config;
using Server.WebAPI.Web.Extensions;
using Server.WebAPI.Web.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration
	.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
	.AddEnvironmentVariables();

builder.Logging.ClearProviders().AddConsole();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Add HttpContextAccessor for ICurrentContext
builder.Services.AddHttpContextAccessor();

// ICurrentContext is registered via AddServiceDependencies (Scrutor scan for IScopedService)

// Bind ServerSetting configuration and enable hot reload via IOptionsMonitor..
var serverSettingSection = builder.Configuration.GetSection("ServerSetting");
builder.Services.Configure<ServerSetting>(serverSettingSection);
var serverSetting = serverSettingSection.Get<ServerSetting>()!; // snapshot (for startup use only)

// Configure JWT Authentication
builder.Services.AddJwtAuthentication(serverSetting);

// Configure OpenTelemetry with Jaeger tracing
builder.Services.AddOpenTelemetryTracing(serverSetting);

// Swagger configuration using ServerSetting values with JWT support
builder.Services.AddSwaggerGen(c =>
{
	var version = serverSetting.OpenApi.Version;
	c.SwaggerDoc(version, new OpenApiInfo
	{
		Title = serverSetting.OpenApi.Title,
		Version = version
	});

	// Add JWT Authentication to Swagger
	c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\r\n\r\nExample: 'Bearer 12345abcdef'",
		Name = "Authorization",
		In = ParameterLocation.Header,
		Type = SecuritySchemeType.ApiKey,
		Scheme = "Bearer"
	});

	c.AddSecurityRequirement(new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecurityScheme
			{
				Reference = new OpenApiReference
				{
					Type = ReferenceType.SecurityScheme,
					Id = "Bearer"
				},
				Scheme = "oauth2",
				Name = "Bearer",
				In = ParameterLocation.Header
			},
			new List<string>()
		}
	});
});

builder.Services.AddHttpClient("OpenWebUI", client =>
{
	var baseUrl = serverSetting.OpenWebUI.BaseUrl;
	if(!string.IsNullOrWhiteSpace(baseUrl))
	{
		client.BaseAddress = new Uri(baseUrl);
	}
});

// add in-memory caching
builder.Services.AddMemoryCache();

// Register application services
builder.Services.AddServiceDependencies(serverSetting);

// Configure EF Core with MongoDB
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if(connectionString == null)
{
	Console.WriteLine("Connection string 'DefaultConnection' not found.");
	return;
}
var mongoUrl = new MongoUrl(connectionString);
builder.Services.AddDbContext<ServerDbContext>(options =>
{
	options.UseMongoDB(connectionString, mongoUrl.DatabaseName ?? "pishkar");
});

var app = builder.Build();

// Add Activity middleware first to ensure TraceId is available for all requests
app.UseActivityMiddleware();

// Add global exception handling middleware
app.UseGlobalExceptionMiddleware();

app.UseRouting();

// Authentication & Authorization middleware (must be after UseRouting and before MapControllers)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// add swagger for API documentation
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint($"/swagger/{serverSetting.OpenApi.Version}/swagger.json", $"{serverSetting.OpenApi.Title} {serverSetting.OpenApi.Version}"));

await app.RunAsync();

public partial class Program { }
