using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.UnRelatedIntent
{
	[Trait("Category", "AI")]
	public class UnRelatedIntentTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public UnRelatedIntentTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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

		[Theory]
		[InlineData("پایتون چیست؟", null)]
		[InlineData("What is the capital of France?", null)]
		public async Task AskAsync_UnRelatedTaskInput_ServiceReturnsCanNotHelp(string userPrompt, string? intent)
		{
			var chat = _serviceProvider.GetRequiredService<IChatService>();

			var input = new AskInputDto
			{
				ChatId = Guid.NewGuid().ToString(),
				Tasks =
				[
					new ChatTaskDto
					{
						Message = userPrompt,
						Intention = intent,
					}
				],
			};

			var result = await chat.AskAsync(input);

			Assert.NotNull(result);
			Assert.NotEmpty(result.Tools);

			var responseContent = result.Tools[0].ResponseMessage;

			var isJson = false;
			try
			{
				var doc = JsonDocument.Parse(responseContent!);
				isJson = true;
			}
			catch (JsonException)
			{
				isJson = false;
			}

			Assert.True(isJson);

			var docRoot = JsonDocument.Parse(responseContent!).RootElement;
			var messageToUser = docRoot.GetProperty("message").GetString();
			Assert.Contains("Sorry but Pishkar can't help you", messageToUser!);
		}

		[Theory]
		[InlineData("some tempt prompt", "skdjbks")]
		public async Task AskAsync_InvalideIntentInput_ServiceReturnsInvalidIntent(string userPrompt, string? intent)
		{
			var chat = _serviceProvider.GetRequiredService<IChatService>();

			var input = new AskInputDto
			{
				ChatId = Guid.NewGuid().ToString(),
				Tasks =
				[
					new ChatTaskDto
					{
						Message = userPrompt,
						Intention = intent,
					}
				],
			};

			var result = await chat.AskAsync(input);

			Assert.NotNull(result);
			Assert.NotEmpty(result.Tools);

			var responseContent = result.Tools[0].ResponseMessage;

			var isJson = false;
			try
			{
				var doc = JsonDocument.Parse(responseContent!);
				isJson = true;
			}
			catch(JsonException)
			{
				isJson = false;
			}

			Assert.True(isJson);

			var docRoot = JsonDocument.Parse(responseContent!).RootElement;
			var messageToUser = docRoot.GetProperty("message").GetString();
			Assert.Contains($"Invalid intent: {intent}", messageToUser!);
		}


		[Fact]
		public async Task AskAsync_NullInput_ServiceReturnsInvalidTask()
		{
			var chat = _serviceProvider.GetRequiredService<IChatService>();

			var input = new AskInputDto
			{
				ChatId = Guid.NewGuid().ToString(),
				Tasks =
				[
					null
				],
			};

			var result = await chat.AskAsync(input);

			Assert.NotNull(result);
			Assert.NotEmpty(result.Tools);

			var responseContent = result.Tools[0].ResponseMessage;

			var isJson = false;
			try
			{
				var doc = JsonDocument.Parse(responseContent!);
				isJson = true;
			}
			catch(JsonException)
			{
				isJson = false;
			}

			Assert.True(isJson);

			var docRoot = JsonDocument.Parse(responseContent!).RootElement;
			var messageToUser = docRoot.GetProperty("message").GetString();
			Assert.Contains("Invalid task item.", messageToUser!);
		}
	}
}
