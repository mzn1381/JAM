using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.MakeCall;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.MakeCall
{
	[Trait("Category", "AI")]
	public class MakeCallChatContextTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public MakeCallChatContextTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		[Trait("Severity", "Critical")]
		public async Task AskAsync_MakeCall_UsingTowChatContext_ReturnValideMakeCall()
		{
			var chat = _serviceProvider.GetRequiredService<IChatService>();
			var serverdbContext = _serviceProvider.GetRequiredService<ServerDbContext>();

			var firstInput = new AskInputDto
			{
				ChatId = Guid.NewGuid().ToString(),
				Tasks =
				[
					new ChatTaskDto
					{
						Message = "I want to do some call to some phoneNumber",
						Intention = null,
					}
				],
			};

			{
				var firstResult = await chat.AskAsync(firstInput);

				Assert.NotNull(firstResult);
				Assert.NotEmpty(firstResult.Tools);

				//var firstResponseContent = firstResult.Tools[0].ResponseMessage;
				//var firstAlarmResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(firstResponseContent!);

				var firstAlarmResultTool = firstResult.Tools[0];

				Assert.NotNull(firstAlarmResultTool);
				Assert.Equal(PromptsNames.MessageToUser, firstAlarmResultTool!.ToolName);
				Assert.NotEmpty(firstAlarmResultTool.Payload["message"]);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.MakeCall, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.Contains("contact or phoneNumber", firstChatContext.ActiveTask.MissingSlots); 
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "09127587896",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondResponseContent = secondResult.Tools[0].ResponseMessage;
				var secondAlarmResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(secondResponseContent!);

				Assert.NotNull(secondAlarmResult);
				Assert.Equal(PromptsNames.MakeCall, secondAlarmResult!.Intent);
				Assert.Equal("09127587896", secondAlarmResult.Call.PhoneNumber);

				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.MakeCall, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, secondChatContext.ActiveTask.Status);
				Assert.Empty(secondChatContext.ActiveTask.MissingSlots);
				Assert.Equal("09127587896", secondChatContext.Payload["phonenumber"]); 
			}
		}
	}
}
