using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.SendEmail;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SendEmail
{
	[Trait("Category", "AI")]
	public class SendEmailChatContextTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SendEmailChatContextTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		public async Task AskAsync_SendEmail_UsingTowChatContext_ReturnValideSendEmail()
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
						Message = "I want you to send me an email and tell my boss I won't be at work becuase of sickness towmorrow",
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

				var firstSendEmailResultTool = firstResult.Tools[0];

				Assert.NotNull(firstSendEmailResultTool);
				Assert.Equal(PromptsNames.MessageToUser, firstSendEmailResultTool!.ToolName);
				Assert.NotEmpty(firstSendEmailResultTool.Payload["message"]);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.SendEmail, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.NotNull(firstChatContext.Payload["body"]);
				Assert.Contains("email", firstChatContext.ActiveTask.MissingSlots);
				//Assert.Contains("subject", firstChatContext.ActiveTask.MissingSlots); 
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "my boss email is ab.arshia@gmail.com and subject of email is Sick Leave",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondResponseContent = secondResult.Tools[0].ResponseMessage;
				var secondSendEmailResult = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(secondResponseContent!);

				Assert.NotNull(secondSendEmailResult);
				Assert.Equal(PromptsNames.SendEmail, secondSendEmailResult!.Intent);
				Assert.NotEmpty(secondSendEmailResult.Body);
				Assert.Equal("ab.arshia@gmail.com", secondSendEmailResult.Email);
				Assert.Equal("Sick Leave", secondSendEmailResult.Subject);

				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.SendEmail, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, secondChatContext.ActiveTask.Status);
				Assert.Empty(secondChatContext.ActiveTask.MissingSlots);
				Assert.NotNull(secondChatContext.Payload["body"]);
				Assert.Equal("ab.arshia@gmail.com", secondChatContext.Payload["email"]);
				Assert.Equal("Sick Leave", secondChatContext.Payload["subject"]); 
			}
		}

		[Fact]
		//[Trait("Severity", "Critical")]
		public async Task AskAsync_SendEmail_UsingThreeChatContext_ReturnValideSendEmail()
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
						Message = "I want to you to send email to my colleagues to gather in tomorrow for compamy meetting",
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

				var firstSendEmailResultTool = firstResult.Tools[0];

				Assert.NotNull(firstSendEmailResultTool);
				Assert.Equal(PromptsNames.MessageToUser, firstSendEmailResultTool!.ToolName);
				Assert.NotEmpty(firstSendEmailResultTool.Payload["message"]);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.SendEmail, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.NotNull(firstChatContext.Payload["body"]);
				Assert.Contains("email", firstChatContext.ActiveTask.MissingSlots);
				//Assert.Contains("subject", firstChatContext.ActiveTask.MissingSlots); 
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "the subject could be Company Technical Meeting",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondSendEmailResultTool = secondResult.Tools[0];

				Assert.NotNull(secondSendEmailResultTool);
				Assert.Equal(PromptsNames.MessageToUser, secondSendEmailResultTool!.ToolName);
				Assert.NotEmpty(secondSendEmailResultTool.Payload["message"]);

				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.SendEmail, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, secondChatContext.ActiveTask.Status);
				Assert.NotEmpty(secondChatContext.ActiveTask.MissingSlots);
				Assert.NotNull(secondChatContext.Payload["body"]);
				Assert.Equal("Company Technical Meeting", secondChatContext.Payload["subject"]);
				Assert.Contains("email", secondChatContext.ActiveTask.MissingSlots);

			}
			var thirdInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "send email to mr.vafaei@gmail.com and cc mojtaba@gmail.com",
						Intention = null,
					}
				]
			};

			{
				var thirdResult = await chat.AskAsync(thirdInput);

				Assert.NotNull(thirdResult);
				Assert.NotEmpty(thirdResult.Tools);

				var thirdResponseContent = thirdResult.Tools[0].ResponseMessage;
				var thirdSendEmailResult = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(thirdResponseContent!);

				Assert.NotNull(thirdSendEmailResult);
				Assert.Equal(PromptsNames.SendEmail, thirdSendEmailResult!.Intent);
				Assert.NotEmpty(thirdSendEmailResult.Body);
				Assert.Equal("mr.vafaei@gmail.com", thirdSendEmailResult.Email);
				Assert.Equal("Company Technical Meeting", thirdSendEmailResult.Subject);
				Assert.Contains("mojtaba@gmail.com", thirdSendEmailResult.Cc);

				var thirdChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == thirdInput.ChatId);
				Assert.NotNull(thirdChatContext);
				Assert.Equal(PromptsNames.SendEmail, thirdChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, thirdChatContext.ActiveTask.Status);
				Assert.Empty(thirdChatContext.ActiveTask.MissingSlots);
				Assert.NotNull(thirdChatContext.Payload["body"]);
				Assert.Equal("mr.vafaei@gmail.com", thirdChatContext.Payload["email"]);
				Assert.Equal("Company Technical Meeting", thirdChatContext.Payload["subject"]);
				Assert.Contains("mojtaba@gmail.com", thirdChatContext.Payload["cc"]!); 
			}
		}
	}
}
