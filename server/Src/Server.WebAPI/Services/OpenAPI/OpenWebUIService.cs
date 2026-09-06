using Microsoft.Extensions.Options;
using Server.WebAPI.Config;
using Server.WebAPI.Models.Metadata;
using Server.WebAPI.Services.MetaData;
using Server.WebAPI.Services.OpenAPI.LLMModel;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Server.WebAPI.Services.OpenAPI
{
	public class OpenWebUIService : IOpenWebUIService
	{
		private readonly HttpClient _httpClient;
		private readonly ServerSetting _settings;
		private readonly ILLMModelConfigService _lLMModelConfigService;
		private readonly ILLMMetadataService _llmMetadataService;
		private readonly ILogger<OpenWebUIService> _logger;

		public OpenWebUIService(
			IOptionsMonitor<ServerSetting> optionsMonitor,
			ILLMModelConfigService lLMModelConfigService,
			ILLMMetadataService llmMetadataService,
			ILogger<OpenWebUIService> logger,
			IHttpClientFactory httpClientFactory)
		{
			_settings = optionsMonitor.CurrentValue;
			_lLMModelConfigService = lLMModelConfigService;
			_llmMetadataService = llmMetadataService;
			_logger = logger;
			_httpClient = httpClientFactory.CreateClient("OpenWebUI");
		}

		public async Task<OpenWebUISendPromptResponseDto> SendPromptAsync(
			OpenWebUISendPromptRequestDto request,
			CancellationToken cancellationToken = default)
		{
			if(request is null)
				throw new ArgumentNullException(nameof(request));

			if(string.IsNullOrWhiteSpace(request.Prompt))
				throw new ArgumentException("Prompt is required", nameof(request.Prompt));

			if(string.IsNullOrWhiteSpace(_settings.OpenWebUI.BaseUrl))
				throw new InvalidOperationException("OpenWebUI.BaseUrl is not configured");

			if(string.IsNullOrWhiteSpace(_settings.OpenWebUI.ModelName))
				throw new InvalidOperationException("OpenWebUI.ModelName is not configured");

			// If caller doesn't have a chat id yet, create one locally
			var resolvedChatId = string.IsNullOrWhiteSpace(request.ChatId)
				? Guid.NewGuid().ToString("N")
				: request.ChatId;

			var stopwatch = Stopwatch.StartNew();
			var response = await SendMessageAsync(resolvedChatId, request.Prompt, request.Message, cancellationToken);
			stopwatch.Stop();

			if(response == null)
				throw new InvalidOperationException("Failed to get response from OpenWebUI.");

			return new OpenWebUISendPromptResponseDto
			{
				ChatResponse = response,
				ResponseMessage = response.Choices.FirstOrDefault()?.Message.Content
					?? throw new InvalidOperationException("No choices returned in OpenWebUI response."),
				ResolvedChatId = resolvedChatId,
				DurationMs = stopwatch.ElapsedMilliseconds,
				TokensUsed = response.Usage.TotalTokens,
			};
		}

		/// <summary>
		/// Calls POST /api/chat/completions (OpenAI compatible).
		/// NOTE: OpenWebUI does not use chat_id in this API; we keep chatId only for our own tracking.
		/// </summary>
		private async Task<ChatCompletionResponse> SendMessageAsync(
			string chatId,
			string prompt,
			List<(string, string)>? messages = null,
			CancellationToken ct = default)
		{
			// In config: SendMessagePath should be "/api/chat/completions"
			var url = CombineUrl(_settings.OpenWebUI.BaseUrl, _settings.OpenWebUI.SendMessagePath);
			var modelName = _lLMModelConfigService.GetLLMModelName();
			const double temperature = 0.5;

			//TODO: remove it and use messages only
			var payload = new
			{
				model = modelName,
				messages = new[]
				{
					new { role = "user", content = prompt }
				},
				// IMPORTANT: no "chat_id" here – OpenWebUI expects pure OpenAI-style body
				temperature = temperature,
			};

			if(messages != null && messages.Count > 0)
			{
				payload = new
				{
					model = modelName,
					messages = messages.Select(m => new { role = m.Item1, content = m.Item2 }).ToArray(),
					temperature = temperature,
				};
			}

			var stopwatch = Stopwatch.StartNew();
			string raw = string.Empty;
			int statusCode = 0;
			bool isSuccess = false;
			string? errorMessage = null;

			try
			{
				using var req = new HttpRequestMessage(HttpMethod.Post, url)
				{
					Content = JsonContent.Create(payload)
				};
				AttachAuth(req);

				using var res = await _httpClient.SendAsync(req, ct);

				raw = await res.Content.ReadAsStringAsync(ct);
				statusCode = (int)res.StatusCode;
				isSuccess = res.IsSuccessStatusCode;

				stopwatch.Stop();

				if(res.IsSuccessStatusCode == false)
				{
					errorMessage = $"OpenWebUI /api/chat/completions failed. Status: {statusCode} {res.StatusCode}. Body: {raw}";

					// Log the failed LLM call
					await LogLLMMetadataAsync(BuildLLMMetadata(
						chatId, prompt, messages, modelName, temperature, url,
						raw, null, statusCode, isSuccess, errorMessage,
						stopwatch.ElapsedMilliseconds), ct);

					_logger.LogWarning(
						"LLM API call failed. TraceId: {TraceId}, StatusCode: {StatusCode}, Model: {Model}, Duration: {Duration}ms",
						Activity.Current!.TraceId.ToString(), statusCode, modelName, stopwatch.ElapsedMilliseconds);

					throw new InvalidOperationException(errorMessage);
				}

				var response = JsonSerializer.Deserialize<ChatCompletionResponse>(raw, JsonDeserializeOptions);

				var content = response?
					.Choices?
					.FirstOrDefault()?
					.Message?
					.Content;

				if(string.IsNullOrWhiteSpace(content))
				{
					errorMessage = "Failed to send message: completion content is empty or invalid.";

					await LogLLMMetadataAsync(BuildLLMMetadata(
						chatId, prompt, messages, modelName, temperature, url,
						raw, response, statusCode, false, errorMessage,
						stopwatch.ElapsedMilliseconds), ct);

					throw new InvalidOperationException(errorMessage);
				}

				// Log successful LLM call
				await LogLLMMetadataAsync(BuildLLMMetadata(
					chatId, prompt, messages, modelName, temperature, url,
					raw, response, statusCode, true, null,
					stopwatch.ElapsedMilliseconds), ct);

				_logger.LogInformation(
					"LLM API call successful. TraceId: {TraceId}, Model: {Model}, Tokens: {Tokens}, Duration: {Duration}ms",
					Activity.Current!.TraceId.ToString(), modelName, response!.Usage?.TotalTokens ?? 0, stopwatch.ElapsedMilliseconds);

				return response!;
			}
			catch(Exception ex)
			{
				stopwatch.Stop();

				// Log exception during LLM call
				await LogLLMMetadataAsync(BuildLLMMetadata(
					chatId, prompt, messages, modelName, temperature, url,
					raw, null, statusCode, false, ex.Message,
					stopwatch.ElapsedMilliseconds), ct);

				_logger.LogError(ex,
					"LLM API call exception. TraceId: {TraceId}, Model: {Model}, Duration: {Duration}ms",
					Activity.Current!.TraceId.ToString(), modelName, stopwatch.ElapsedMilliseconds);

				throw;
			}
		}

		private void AttachAuth(HttpRequestMessage req)
		{
			if(!string.IsNullOrWhiteSpace(_settings.OpenWebUI.ApiKey))
			{
				req.Headers.Authorization =
					new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.OpenWebUI.ApiKey);
			}
		}

		/// <summary>
		/// baseUrl: "http://host:8080", path: "/api/..." => "http://host:8080/api/..."
		/// Make sure path in config starts with a leading '/'.
		/// </summary>
		private static string CombineUrl(string baseUrl, string path)
		{
			if(string.IsNullOrWhiteSpace(path))
				return baseUrl;

			if(baseUrl.EndsWith('/')) baseUrl = baseUrl.TrimEnd('/');
			return baseUrl + path;
		}

		public Task<List<ModelDto>> GetAvailableModelsAsync(CancellationToken cancellationToken = default)
		{
			// get models is not supported in OpenWebUI currently
			throw new NotImplementedException("GetAvailableModelsAsync is not supported in OpenWebUI.");
		}

		private static readonly JsonSerializerOptions JsonDeserializeOptions = new()
		{
			PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
			DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
		};

		private static LLMMetadata BuildLLMMetadata(
			string chatId,
			string prompt,
			List<(string, string)>? messages,
			string model,
			double temperature,
			string requestUrl,
			string rawResponse,
			ChatCompletionResponse? response,
			int statusCode,
			bool isSuccess,
			string? errorMessage,
			long durationMs)
		{
			var currentActivity = Activity.Current;
			var traceId = currentActivity?.TraceId.ToString();
			var spanId = currentActivity?.SpanId.ToString();
			var parentSpanId = currentActivity?.ParentSpanId.ToString();

			return new LLMMetadata
			{
				ChatId = chatId,
				Messages = JsonSerializer.Serialize(messages, new JsonSerializerOptions { WriteIndented = true }),
				Prompt = prompt,
				Model = model,
				Temperature = temperature,
				RequestUrl = requestUrl,
				RawResponse = rawResponse,
				ResponseContent = response?.Choices?.FirstOrDefault()?.Message?.Content,
				PromptTokens = response?.Usage?.PromptTokens ?? 0,
				CompletionTokens = response?.Usage?.CompletionTokens ?? 0,
				TotalTokens = response?.Usage?.TotalTokens ?? 0,
				DurationMs = durationMs,
				StatusCode = statusCode,
				IsSuccess = isSuccess,
				ErrorMessage = errorMessage,
				TraceId = traceId,
				SpanId = spanId,
				ParentSpanId = parentSpanId,
				CompletionId = response?.Id,
				ServiceTier = response?.ServiceTier,
				SystemFingerprint = response?.SystemFingerprint,
				ReasoningContent = response?.Choices?.FirstOrDefault()?.Message?.ReasoningContent
					?? response?.Choices?.FirstOrDefault()?.Message?.Reasoning
			};
		}

		private async Task LogLLMMetadataAsync(LLMMetadata metadata, CancellationToken ct)
		{
			_logger.LogInformation(JsonSerializer.Serialize(metadata, new JsonSerializerOptions()
			{
				WriteIndented = true,
			}));

			await _llmMetadataService.LogAsync(metadata, ct);
		}
	}
	public sealed class ChatCompletionResponse
	{
		[JsonPropertyName("id")]
		public string Id { get; set; } = string.Empty;

		[JsonPropertyName("model")]
		public string Model { get; set; } = string.Empty;

		[JsonPropertyName("service_tier")]
		public string? ServiceTier { get; set; }

		[JsonPropertyName("system_fingerprint")]
		public string? SystemFingerprint { get; set; }

		[JsonPropertyName("choices")]
		public List<Choice> Choices { get; init; } = new();

		[JsonPropertyName("usage")]
		public APICallUsage? Usage { get; set; }
	}

	public sealed class Choice
	{
		[JsonPropertyName("message")]
		public ChatMessage Message { get; init; } = new();

		[JsonPropertyName("finish_reason")]
		public string? FinishingReason { get; init; }
	}

	public sealed class ChatMessage
	{
		[JsonPropertyName("role")]
		public string Role { get; init; } = string.Empty;

		[JsonPropertyName("content")]
		public string Content { get; init; } = string.Empty;

		// TODO:
		// tool_calls
		// function_call

		[JsonPropertyName("reasoning_content")]
		public string? ReasoningContent { get; init; }

		[JsonPropertyName("reasoning")]
		public string? Reasoning { get; init; }
	}

	public class APICallUsage
	{
		[JsonPropertyName("prompt_tokens")]
		public int PromptTokens { get; set; }

		[JsonPropertyName("completion_tokens")]
		public int CompletionTokens { get; set; }

		[JsonPropertyName("total_tokens")]
		public int TotalTokens { get; set; }

		[JsonPropertyName("prompt_tokens_detail")]
		public string? PromptTokensDetail { get; set; }
	}
}
