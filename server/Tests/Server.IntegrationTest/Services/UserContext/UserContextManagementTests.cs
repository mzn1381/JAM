using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Chat.ContextManagement.UserContextManager;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.UserContext
{
	public class UserContextManagementTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public UserContextManagementTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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

		[Fact]
		public async Task CreateUserExplainer_ValidInput_UserContextCreated()
		{
			// Arrange
			var user = new User()
			{
				FirstName = "abolfazl",
				LastName = "arshia",
				Username = "sekiro",
				Email = "mrsekiro@gmail.com",
				EmailVerified = true,
				PhoneNumberVerified = true,
			};

			var serverDbContext = _serviceProvider.GetRequiredService<ServerDbContext>();
			serverDbContext.Users.Add(user);
			await serverDbContext.SaveChangesAsync();

			var userContextManager = _serviceProvider.GetRequiredService<IUserContextManager>();
			var input = new UserContextDto
			{
				PreferencesItems = new Dictionary<string, bool>
				{
					{ "Programming", true },
					{ "Tennis", true },
					{ "History", false  },
				}
			};

			// Act
			await userContextManager.CreateUserExplainer(input, user.Id);

			// Assert
			var userContext = serverDbContext.UserContexts.FirstOrDefault(uc => uc.UserId == user.Id);

			Assert.NotNull(userContext);
			Assert.NotEmpty(userContext.UserExplanation);
		}
	}
}
