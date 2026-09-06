using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.LLM.Responses.SetCalendar;
using Server.WebAPI.Services.Chat;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.SetCalendar
{
	[Trait("Category", "AI")]
	public class SetCalendarChatContextTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public SetCalendarChatContextTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
						Message = "set me calendar event for my firend birthday with title Sayin Birthday",
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

				var firstSetCalendarResultTool = firstResult.Tools[0];

				Assert.NotNull(firstSetCalendarResultTool);
				Assert.Equal(PromptsNames.MessageToUser, firstSetCalendarResultTool!.ToolName);
				Assert.NotEmpty(firstSetCalendarResultTool.Payload["message"]);

				var firstChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == firstInput.ChatId);

				Assert.NotNull(firstChatContext);
				Assert.Equal(PromptsNames.SetCalendar, firstChatContext.ActiveTask.Intent);
				Assert.Equal(Status.MissingInfo, firstChatContext.ActiveTask.Status);
				Assert.Contains("Sayin Birthday", firstChatContext.Payload["title"]);
				Assert.Contains("start", firstChatContext.ActiveTask.MissingSlots);
				Assert.Contains("date", firstChatContext.ActiveTask.MissingSlots);
			}

			var secondInput = new AskInputDto()
			{
				ChatId = firstInput.ChatId,
				Tasks =
				[
					new ChatTaskDto()
					{
						Message = "the birthday is on 2026-02-20 and 14:00",
						Intention = null,
					}
				]
			};

			{
				var secondResult = await chat.AskAsync(secondInput);

				Assert.NotNull(secondResult);
				Assert.NotEmpty(secondResult.Tools);

				var secondResponseContent = secondResult.Tools[0].ResponseMessage;
				var secondSetCalendarResult = JsonSerializer.Deserialize<SuccessfulSetCalendarResult>(secondResponseContent!);

				Assert.NotNull(secondSetCalendarResult);
				Assert.Equal(PromptsNames.SetCalendar, secondSetCalendarResult!.Intent);
				Assert.Equal("Sayin Birthday", secondSetCalendarResult.Event.Title);
				Assert.Equal("2026-02-20", secondSetCalendarResult.Event.Date);
				Assert.Equal("14:00", secondSetCalendarResult.Event.Start);


				var secondChatContext = serverdbContext.ChatContexts.FirstOrDefault(c => c.ChatId.ToString() == secondInput.ChatId);

				Assert.NotNull(secondChatContext);
				Assert.Equal(PromptsNames.SetCalendar, secondChatContext.ActiveTask.Intent);
				Assert.Equal(Status.Done, secondChatContext.ActiveTask.Status);
				Assert.Empty(secondChatContext.ActiveTask.MissingSlots);
				Assert.Contains("Sayin Birthday", secondChatContext.Payload["title"]);
				Assert.Contains("2026-02-20", secondChatContext.Payload["date"]);
				Assert.Contains("14:00", secondChatContext.Payload["start"]);
			}
		}
	}
}
