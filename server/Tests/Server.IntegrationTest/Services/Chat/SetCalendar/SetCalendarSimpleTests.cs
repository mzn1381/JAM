using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Models.LLM.Responses.SetCalendar;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SetCalendar
{
	[Trait("Category", "AI")]
	public class SetCalendarSimpleTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SetCalendarSimpleTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[InlineData("لطفا یک رویداد تقویم برای فردا ساعت ۱۰:۳۰ با عنوان جلسه تنظیم کن", PromptsNames.SetCalendar)]
		[InlineData("لطفا یک رویداد تقویم برای فردا ساعت ۱۰:۳۰ با عنوان جلسه تنظیم کن", null)]
		//[InlineData("Please create a calendar event for tomorrow at 10:30 AM titled Meeting", PromptsNames.SetCalendar)]
		[InlineData("Please create a calendar event for tomorrow at 10:30 AM titled Meeting", null)]
		public async Task AskAsync_SetCalendar_ValidCompleteInput_ServiceReturnsSetCalendarResult(string userPrompt, string? intent)
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
			var calendarResult = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(responseContent!);

			Assert.NotNull(calendarResult);
			Assert.Equal(PromptsNames.SetCalendar, calendarResult!.Intent);
			//Assert.NotEmpty(calendarResult.Calendar.Title);
		}

		//[Theory]
		//[InlineData("پایتون چیست؟", PromptsNames.SetCalendar)]
		//[InlineData("What is the capital of France?", PromptsNames.SetCalendar)]
		//public async Task AskAsync_SetCalendar_NotRelatedInput_ServiceReturnsCanNotHelp(string userPrompt, string? intent)
		//{
		//	var chat = _serviceProvider.GetRequiredService<IChatService>();

		//	var input = new AskInputDto
		//	{
		//		ChatId = Guid.NewGuid().ToString(),
		//		Tasks =
		//		[
		//			new ChatTaskDto
		//			{
		//				Message = userPrompt,
		//				Intention = intent,
		//			}
		//		],
		//	};

		//	var result = await chat.AskAsync(input);

		//	Assert.NotNull(result);
		//	Assert.NotEmpty(result.Tools);

		//	var responseContent = result.Tools[0].ResponseMessage;
		//	var calendarResult = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(responseContent!);

		//	Assert.NotNull(calendarResult);
		//	Assert.Equal(PromptsNames.None, calendarResult!.Intent);
		//	Assert.NotEmpty(calendarResult.MessageToUser);
		//}

		[Theory]
		//[InlineData("لطفا یک رویداد تقویم تنظیم کن", PromptsNames.SetCalendar)]
		[InlineData("لطفا یک رویداد تقویم تنظیم کن", null)]
		//[InlineData("یک رویداد ایجاد کن", PromptsNames.SetCalendar)]
		[InlineData("یک رویداد ایجاد کن", null)]
		//[InlineData("Please create a calendar event", PromptsNames.SetCalendar)]
		[InlineData("Please create a calendar event", null)]
		public async Task AskAsync_SetCalendar_MissingFieldsInput_ServiceReturnsMissingFields(string userPrompt, string? intent)
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
			//var calendarResult = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(responseContent!);

			//Assert.NotNull(calendarResult);
			//Assert.NotEmpty(calendarResult.MessageToUser);
			//Assert.NotNull(calendarResult.Missing);
			//Assert.NotEmpty(calendarResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}

		[Theory]
		//[InlineData("لطفا یک رویداد تقویم برای فردا ساعت ۱۰ تنظیم کن", PromptsNames.SetCalendar)]
		[InlineData("لطفا یک رویداد تقویم برای فردا ساعت ۱۰ تنظیم کن", null)]
		//[InlineData("Please create a calendar event for tomorrow at 10 AM", PromptsNames.SetCalendar)]
		[InlineData("Please create a calendar event for tomorrow at 10 AM", null)]
		public async Task AskAsync_SetCalendar_MissingTitleInput_ServiceReturnsMissingTitle(string userPrompt, string? intent)
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
			//var calendarResult = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(responseContent!);

			//Assert.NotNull(calendarResult);
			//Assert.NotEmpty(calendarResult.MessageToUser);
			//Assert.NotNull(calendarResult.Missing);
			//Assert.Contains("title", calendarResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}
	}
}
