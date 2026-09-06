using Microsoft.Extensions.DependencyInjection;
using Server.IntegrationTest.Bases;
using Server.IntegrationTest.Factory;
using Server.WebAPI.Models.LLM.Responses.MakeCall;
using Server.WebAPI.Services.Chat;
using System.Text.Json;
using Xunit.Abstractions;

namespace Server.IntegrationTest.Services.Chat.MakeCall
{
	[Trait("Category", "AI")]
	public class MakeCallSimpleTests : ServerTestBase, IClassFixture<ServerWebApplicationFactory>
	{
		private readonly ITestOutputHelper _outputHelper;
		private readonly ServerWebApplicationFactory _factory;
		private readonly IServiceProvider _serviceProvider;

		public MakeCallSimpleTests(ServerWebApplicationFactory factory, ITestOutputHelper outputHelper)
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
		//[InlineData("با شماره 09123456789 تماس بگیر", PromptsNames.MakeCall)]
		[InlineData("با شماره 09123456789 تماس بگیر", null)]
		//[InlineData("Please call 09123456789", PromptsNames.MakeCall)]
		[InlineData("Please call 09123456789", null)]
		public async Task AskAsync_MakeCall_ValidPhoneNumber_ServiceReturnsMakeCallToPhoneNumberResult(string userPrompt, string? intent)
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
			var callResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(responseContent!);

			Assert.NotNull(callResult);
			Assert.Equal(PromptsNames.MakeCall, callResult!.Intent);
			Assert.NotEmpty(callResult.Call.PhoneNumber);
		}

		[Theory]
		//[InlineData("با علی تماس بگیر", PromptsNames.MakeCall)]
		[InlineData("با علی تماس بگیر", null)]
		//[InlineData("Call Ali", PromptsNames.MakeCall)]
		[InlineData("Call Ali", null)]
		public async Task AskAsync_MakeCall_ValidContact_ServiceReturnsMakeCallToContactResult(string userPrompt, string? intent)
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
			var callResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(responseContent!);

			Assert.NotNull(callResult);
			Assert.Equal(PromptsNames.MakeCall, callResult!.Intent);
			Assert.NotEmpty(callResult.Call.Contact);
		}

		//[Theory]
		//[InlineData("پایتون چیست؟", PromptsNames.MakeCall)]
		//[InlineData("What is the capital of France?", PromptsNames.MakeCall)]
		//public async Task AskAsync_MakeCall_NotRelatedInput_ServiceReturnsCanNotHelp(string userPrompt, string? intent)
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
		//	var callResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(responseContent!);

		//	Assert.NotNull(callResult);
		//	Assert.Equal(PromptsNames.None, callResult!.Intent);
		//	Assert.NotEmpty(callResult.MessageToUser);
		//}

		[Theory]
		//[InlineData("لطفا یک تماس بگیر", PromptsNames.MakeCall)]
		[InlineData("لطفا یک تماس بگیر", null)]
		//[InlineData("Please make a call", PromptsNames.MakeCall)]
		[InlineData("Please make a call", null)]
		public async Task AskAsync_MakeCall_MissingPhoneNumberInput_ServiceReturnsMissingPhoneNumber(string userPrompt, string? intent)
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
			//var callResult = JsonSerializer.Deserialize<SuccessfulMakeCallResult>(responseContent!);

			//Assert.NotNull(callResult);
			//Assert.Equal(PromptsNames.MakeCall, callResult.Intent);
			//Assert.NotEmpty(callResult.MessageToUser);
			//Assert.NotNull(callResult.Missing);
			//Assert.Contains("contact or phoneNumber", callResult.Missing);

			var tool = result.Tools[0];
			Assert.Equal(PromptsNames.MessageToUser, tool.ToolName);
			Assert.NotEmpty(tool.Payload["message"]);
		}
	}
}
