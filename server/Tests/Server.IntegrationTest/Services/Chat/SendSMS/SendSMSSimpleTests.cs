using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Models.LLM.Responses.SendSMS;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SendSMS
{
	[Trait("Category", "AI")]
	public class SendSMSSimpleTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SendSMSSimpleTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[InlineData("لطفا یک پیامک بفرست به شماره 09123456789 و بگو سلام چطوری؟", PromptsNames.SendSMS)]
		[InlineData("لطفا یک پیامک بفرست به شماره 09123456789 و بگو سلام چطوری؟", null)]
		//[InlineData("لطفا یک اس ام اس بفرست به شماره 09123456789 و بگو سلام چطوری؟", PromptsNames.SendSMS)]
		[InlineData("لطفا یک اس ام اس بفرست به شماره 09123456789 و بگو سلام چطوری؟", null)]
		//[InlineData("Please send an SMS to 09123456789 with message Hello how are you", PromptsNames.SendSMS)]
		[InlineData("Please send an SMS to 09123456789 with message Hello how are you", null)]
		public async Task AskAsync_SendSMS_ValidCompleteInput_ServiceReturnsSendSMSResult(string userPrompt, string? intent)
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
			var smsResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(responseContent!);

			Assert.NotNull(smsResult);
			Assert.Equal(PromptsNames.SendSMS, smsResult!.Intent);
			Assert.NotEmpty(smsResult.PhoneNumber);
			Assert.NotEmpty(smsResult.Message);
		}

		[Theory]
		//[InlineData("یک پیامک بفرست", PromptsNames.SendSMS)]
		[InlineData("یک پیامک بفرست", null)]
		//[InlineData("Please send an SMS", PromptsNames.SendSMS)]
		[InlineData("Please send an SMS", null)]
		public async Task AskAsync_SendSMS_MissingFieldsInput_ServiceReturnsMissingFields(string userPrompt, string? intent)
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
			//var smsResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(responseContent!);

			//Assert.NotNull(smsResult);
			//Assert.NotEmpty(smsResult.MessageToUser);
			//Assert.NotNull(smsResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}

		[Theory]
		//[InlineData("لطفا یک پیامک بفرست به شماره 09123456789", PromptsNames.SendSMS)]
		[InlineData("لطفا یک پیامک بفرست به شماره 09123456789", null)]
		//[InlineData("Please send an SMS to 09123456789", PromptsNames.SendSMS)]
		[InlineData("Please send an SMS to 09123456789", null)]
		public async Task AskAsync_SendSMS_MissingMessageInput_ServiceReturnsMissingMessage(string userPrompt, string? intent)
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
			//var smsResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(responseContent!);

			//Assert.NotNull(smsResult);
			//Assert.NotEmpty(smsResult.MessageToUser);
			//Assert.NotNull(smsResult.Missing);
			//Assert.Contains("message", smsResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}
	}
}
