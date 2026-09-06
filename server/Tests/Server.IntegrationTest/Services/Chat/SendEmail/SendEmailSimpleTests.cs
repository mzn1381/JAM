using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Models.LLM.Responses.SendEmail;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SendEmail
{
	[Trait("Category", "AI")]
	public class SendEmailSimpleTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SendEmailSimpleTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[InlineData("لطفا یک ایمیل به test@example.com ارسال کن با موضوع سلام و بگو این یک ایمیل تستی هست", PromptsNames.SendEmail)]
		[InlineData("لطفا یک ایمیل به test@example.com ارسال کن با موضوع سلام و بگو این یک ایمیل تستی هست", null)]
		//[InlineData("Please send an email to test@example.com with subject Hello and say This is a test email", PromptsNames.SendEmail)]
		[InlineData("Please send an email to test@example.com with subject Hello and say This is a test email", null)]
		public async Task AskAsync_SendEmail_ValidCompleteInput_ServiceReturnsSendEmailResult(string userPrompt, string? intent)
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
			var emailResult = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(responseContent!);

			Assert.NotNull(emailResult);
			Assert.Equal(PromptsNames.SendEmail, emailResult!.Intent);
			Assert.NotEmpty(emailResult.Email);
			Assert.NotEmpty(emailResult.Subject);
		}

		[Theory]
		//[InlineData("یک ایمیل بفرست", PromptsNames.SendEmail)]
		[InlineData("یک ایمیل بفرست", null)]
		//[InlineData("Please send an email", PromptsNames.SendEmail)]
		[InlineData("Please send an email", null)]
		public async Task AskAsync_SendEmail_MissingFieldsInput_ServiceReturnsMissingFields(string userPrompt, string? intent)
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

			//var responseContent = result.Tools[0].ResponseMessage;
			//var emailResult = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(responseContent!);

			//Assert.NotNull(emailResult);
			//Assert.NotEmpty(emailResult.MessageToUser);
			//Assert.NotNull(emailResult.Missing);
			//Assert.Contains("email", emailResult.Missing);
			//Assert.Contains("subject", emailResult.Missing);
			//Assert.Contains("body", emailResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}

		[Theory]
		//[InlineData("لطفا یک ایمیل به test@example.com بفرست", PromptsNames.SendEmail)]
		[InlineData("لطفا یک ایمیل به test@example.com بفرست", null)]
		//[InlineData("Please send an email to test@example.com", PromptsNames.SendEmail)]
		[InlineData("Please send an email to test@example.com", null)]
		public async Task AskAsync_SendEmail_MissingSubjectAndBodyInput_ServiceReturnsMissingSubjectAndBody(string userPrompt, string? intent)
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

			//var responseContent = result.Tools[0].ResponseMessage;
			//var emailResult = JsonSerializer.Deserialize<SuccessfulSendEmailResult>(responseContent!);

			//Assert.NotNull(emailResult);
			//Assert.NotEmpty(emailResult.MessageToUser);
			//Assert.NotNull(emailResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}
	}
}
