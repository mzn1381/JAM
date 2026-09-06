using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Models.LLM.Responses.MakeCall;
using Server.WebAPI.Models.LLM.Responses.SendSMS;
using Server.WebAPI.Models.LLM.Responses.SetAlram;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.MultipleIntents
{
	[Trait("Category", "AI")]
	public class MultipleIntentsChatTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public MultipleIntentsChatTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		public async Task AskAsync_MultipleIntents_SetAlarmSendSMSSequential_BothWorks()
		{
			var chatId = Guid.NewGuid().ToString();
			var chat = _serviceProvider.GetRequiredService<IChatService>();

			await SetAlarm(chatId, chat);

			await SendSMS(chatId, chat);
		}

		[Fact]
		[Trait("Severity", "Critical")]
		public async Task AskAsync_MultipleIntents_SetAlarmMakeCallSequential_BothWorks()
		{
			var chatId = Guid.NewGuid().ToString();
			var chat = _serviceProvider.GetRequiredService<IChatService>();

			await SetAlarm(chatId, chat);

			await MakeCall(chatId, chat);
		}

		private async Task MakeCall(string chatId, IChatService chat)
		{
			var makeCallInput = new AskInputDto
			{
				ChatId = chatId,
				Tasks =
				[
					new ChatTaskDto
					{
						Message = "به شماره 09924919807 زنگ بزن",
						Intention = null,
					}
				],
			};

			var makeCallResult = await chat.AskAsync(makeCallInput);

			Assert.NotNull(makeCallResult);
			Assert.NotEmpty(makeCallResult.Tools);

			var makeCallResponseContent = makeCallResult.Tools[0].ResponseMessage;
			_outputHelper.WriteLine("Make Call Response: " + makeCallResponseContent);

			var makeCallResultObj = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(makeCallResponseContent!);
			Assert.NotNull(makeCallResultObj);
			Assert.Equal(PromptsNames.MakeCall, makeCallResultObj!.Intent);
			Assert.Equal("09924919807", makeCallResultObj.Call.PhoneNumber);
		}

		private async Task SendSMS(string chatId, IChatService chat)
		{
			var sendSMSInput = new AskInputDto
			{
				ChatId = chatId,
				Tasks =
				[
					new ChatTaskDto
					{
						Message = "یک پیامک به علی بفرست که میگم ساعت 7:20 بیدارم کن",
						Intention = null,
					}
				],
			};

			var sendSMSResult = await chat.AskAsync(sendSMSInput);

			Assert.NotNull(sendSMSResult);
			Assert.NotEmpty(sendSMSResult.Tools);

			var sendSMSResponseContent = sendSMSResult.Tools[0].ResponseMessage;
			_outputHelper.WriteLine("Send SMS Response: " + sendSMSResponseContent);

			var SMSResult = JsonSerializer.Deserialize<SuccessfulSendSMSResult>(sendSMSResponseContent!);

			Assert.NotNull(SMSResult);
			Assert.Equal(PromptsNames.SendSMS, SMSResult!.Intent);
			Assert.Equal("علی", SMSResult.ContactName);
			Assert.NotEmpty(SMSResult.Message);
		}

		private async Task SetAlarm(string chatId, IChatService chat)
		{
			var setAlarmInput = new AskInputDto
			{
				ChatId = chatId,
				Tasks =
				[
					new ChatTaskDto
					{
						Message = "یک آلارم برای ساعت 7:20 ایجاد کن",
						Intention = null,
					}
				],
			};

			var setAlarmResult = await chat.AskAsync(setAlarmInput);

			Assert.NotNull(setAlarmResult);
			Assert.NotEmpty(setAlarmResult.Tools);

			var setAlarmResponseContent = setAlarmResult.Tools[0].ResponseMessage;
			var alarmResult = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(setAlarmResponseContent!);

			Assert.NotNull(alarmResult);
			Assert.Equal(PromptsNames.SetAlarm, alarmResult!.Intent);
			Assert.Equal(7, alarmResult.Alarm.Hour);
			Assert.Equal(20, alarmResult.Alarm.Minutes);
		}
	}
}
