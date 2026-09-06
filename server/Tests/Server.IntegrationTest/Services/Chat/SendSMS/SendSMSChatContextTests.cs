using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.SendSMS;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SendSMS
{
	[Trait("Category", "AI")]
	public class SendSMSChatContextTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SendSMSChatContextTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[Trait("Severity", "Critical")]
		public async Task AskAsync_SendSMS_UsingTowChatContext_ReturnValideSendSMS()
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
						Message = "send me an sms to the mr.vafaei",
						Intention = null,
					}
				],
			};

			{
				var firstResult = await chat.AskAsync(firstInput);

				Assert.NotNull(firstResult);
				Assert.NotEmpty(firstResult.Tools);

				//var firstResponseContent = firstResult.Tools[0].ResponseMessage;
				//var firstAlarmResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(firstResponseContent!);

				//Assert.NotNull(firstAlarmResult);
				//Assert.Equal(PromptsNames.SendSMS, firstAlarmResult!.Intent);
				//Assert.Contains("message", firstAlarmResult.Missing);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.SendSMS, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.Contains("message", firstChatContext.ActiveTask.MissingSlots);
				Assert.Equal("mr.vafaei", firstChatContext.Payload["contactname"]!.Replace(" ", "").ToLower()); 
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "when will be the tonight excersise?",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondResponseContent = secondResult.Tools[0].ResponseMessage;
				var secondAlarmResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(secondResponseContent!);

				Assert.NotNull(secondAlarmResult);
				Assert.Equal(PromptsNames.SendSMS, secondAlarmResult!.Intent);
				Assert.Equal("mr.vafaei", secondAlarmResult.ContactName);
				Assert.Equal("when will be the tonight excersise?", secondAlarmResult.Message);

				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.SendSMS, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, secondChatContext.ActiveTask.Status);
				Assert.Empty(secondChatContext.ActiveTask.MissingSlots);
				Assert.Equal("mr.vafaei", secondChatContext.Payload["contactname"]);
				Assert.Equal("when will be the tonight excersise?", secondChatContext.Payload["message"]); 
			}
		}
	}
}
