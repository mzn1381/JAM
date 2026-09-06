using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.SetAlram;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SetAlram
{
	[Trait("Category", "AI")]
	public class SetAlarmChatContextTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SetAlarmChatContextTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		public async Task AskAsync_SetAlarm_UsingTowChatContext_ReturnValideSetAlarm()
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
						Message = "Please set me alarm, I know it's 45 minute but I don't know the hour still",
						Intention = null,
					}
				],
			};

			{
				var firstResult = await chat.AskAsync(firstInput);

				Assert.NotNull(firstResult);
				Assert.NotEmpty(firstResult.Tools);

				//var firstResponseContent = firstResult.Tools[0].ResponseMessage;
				//var firstAlarmResult = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(firstResponseContent!);

				//Assert.NotNull(firstAlarmResult);
				//Assert.Equal(PromptsNames.SetAlarm, firstAlarmResult!.Intent);
				//Assert.Contains("minutes", firstAlarmResult.Missing);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.SetAlarm, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.Contains("hour", firstChatContext.ActiveTask.MissingSlots);
				Assert.Equal("45", firstChatContext.Payload["minutes"]); 
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "17",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondResponseContent = secondResult.Tools[0].ResponseMessage;
				var secondAlarmResult = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(secondResponseContent!);

				Assert.NotNull(secondAlarmResult);
				Assert.Equal(PromptsNames.SetAlarm, secondAlarmResult!.Intent);
				Assert.Equal(17, secondAlarmResult.Alarm.Hour);
				Assert.Equal(45, secondAlarmResult.Alarm.Minutes);

				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.SetAlarm, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, secondChatContext.ActiveTask.Status);
				Assert.Empty(secondChatContext.ActiveTask.MissingSlots);
				Assert.Equal("17", secondChatContext.Payload["hour"]);
				Assert.Equal("45", secondChatContext.Payload["minutes"]); 
			}
		}
	}
}
