using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MongoDB.Driver;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Config;
using Testcontainers.MongoDb;

namespace Server.IntegrationTest.Factory
{
	public class ServerWebApplicationFactory : WebApplicationFactory<Program>, IAsyncDisposable
	{
		private readonly MongoDbContainer _mongoContainer;

		public IConfiguration Configuration { get; private set; } = default!;
		public ServerSetting ServerSetting { get; private set; }

		public ServerWebApplicationFactory()
		{
			_mongoContainer = new MongoDbBuilder()
				.WithImage("mongo:latest")
				.WithCleanUp(true)
				.Build();

			_mongoContainer.StartAsync().GetAwaiter().GetResult();
			Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", _mongoContainer.GetConnectionString());
			Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
		}

		protected override void ConfigureWebHost(IWebHostBuilder builder)
		{
			builder.ConfigureAppConfiguration((context, configBuilder) =>
			{
				var cfg = new ConfigurationBuilder()
					.SetBasePath(context.HostingEnvironment.ContentRootPath)
					//.AddJsonFile("appsettings.json", optional: true)
					.AddJsonFile("appsettings.Test.json", optional: true)
					.AddEnvironmentVariables()
					.Build();

				Configuration = cfg;
				configBuilder.AddConfiguration(cfg);

				ServerSetting = cfg.GetSection("ServerSetting").Get<ServerSetting>();
			});

			builder.ConfigureServices(services =>
			{
				// Replace DbContext registration to ensure using Testcontainers connection string
				var dbContextDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ServerDbContext>));
				if(dbContextDescriptor != null)
				{
					services.Remove(dbContextDescriptor);
				}

				services.AddDbContext<ServerDbContext>(options =>
				{
					var connectionString = _mongoContainer.GetConnectionString();
					var mongoUrl = new MongoUrl(connectionString);
					options.UseMongoDB(connectionString, "pishkar");
				});

				//if (_useFakeOpenWebUI)
				//{
				//	var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IOpenWebUIService));
				//	if (descriptor != null)
				//	{
				//		services.Remove(descriptor);
				//	}
				//	services.AddTransient<IOpenWebUIService, Fakes.FakeOpenWebUIService>();
				//}

				//services.Configure<ServerSetting>(ServerSetting);
			});
		}

		public override async ValueTask DisposeAsync()
		{
			await _mongoContainer.DisposeAsync();
			await base.DisposeAsync();
		}
	}
}
