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
	public class SetAlarmSimpleTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SetAlarmSimpleTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[InlineData("لطفا یک آلارم برای فردا صبح ساعت ۷ تنظیم کن", PromptsNames.SetAlarm, 7, 0)]
		[InlineData("لطفا یک آلارم برای فردا صبح ساعت ۷ تنظیم کن", null, 7, 0)]
		//[InlineData("یک آلارم برای ساعت 7 ایجاد کن", PromptsNames.SetAlarm, 7, 0)]
		[InlineData("یک آلارم برای ساعت 7 ایجاد کن", null, 7 , 0)]
		//[InlineData("یک آلارم برای ساعت 7:20 ایجاد کن", PromptsNames.SetAlarm, 7, 20)]
		[InlineData("یک آلارم برای ساعت 7:20 ایجاد کن", null	, 7, 20)]
		//[InlineData("Please set an alarm for tomorrow morning at 7 AM", PromptsNames.SetAlarm, 7, 0)]
		[InlineData("Please set an alarm for tomorrow morning at 7 AM", null, 7, 0)]
		[InlineData("یه آلارم برای ساعت ۵ عصر ست کن", null, 17, 0)]
		//[InlineData("یه آلارم برای ساعت ۵ عصر ست کن", PromptsNames.SetAlarm, 17, 0)]
		public async Task AskAsync_SetAlarm_ValidCompleteInput_ServiceReturnsSetAlarmResult(string userPrompt, string? intent, int hour, int minute)
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
			var alarmResult = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(responseContent!);

			Assert.NotNull(alarmResult);
			Assert.Equal(PromptsNames.SetAlarm, alarmResult!.Intent);
			Assert.Equal(hour, alarmResult.Alarm.Hour);
			Assert.Equal(minute, alarmResult.Alarm.Minutes);
		}

		[Theory]
		//[InlineData("لطفا یک آلارم برای فردا صبح تنظیم کن", PromptsNames.SetAlarm)]
		[InlineData("لطفا یک آلارم برای فردا صبح تنظیم کن", null)]
		[InlineData("یک آلارم ست کن", null)]
		//[InlineData("Please set an alarm for tomorrow morning", PromptsNames.SetAlarm)]
		[InlineData("Please set an alarm for tomorrow morning", null)]
		public async Task AskAsync_SetAlarm_MissingHourInput_ServiceReturnsCanNotHelp(string userPrompt, string? intent)
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
			//var alarmResult = JsonSerializer.Deserialize<SuccessfulSetAlarmResult>(responseContent!);

			//Assert.NotNull(alarmResult);
			//Assert.Equal(PromptsNames.SetAlarm, alarmResult!.Intent);
			//Assert.NotEmpty(alarmResult.MessageToUser);
			//Assert.NotNull(alarmResult.Missing);
			//Assert.Contains("hour", alarmResult.Missing);
			//Assert.Contains("minutes", alarmResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}
	}
}
