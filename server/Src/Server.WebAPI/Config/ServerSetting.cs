namespace Server.WebAPI.Config
{
	public class ServerSetting
	{
		public JwtSetting Jwt { get; set; } = new();
		public LoginSetting Login { get; set; } = new();
		public OpenApiSetting OpenApi { get; set; } = new();
		public PromptSetting Prompt { get; set; } = new();
		public InternalIntentDetector IntentDetector { get; set; } = new();
		public OpenWebUISetting OpenWebUI { get; set; } = new();
		public OpenTelemetrySetting OpenTelemetry { get; set; } = new();
		public JaegerSetting Jaeger { get; set; } = new();
		public NaturalLanguageGeneratorSetting NaturalLanguageGenerator { get; set; } = new();
	}

	public class LoginSetting
	{
		public int MaxFailedAttempts { get; set; } = 5;
		public int LockoutDurationMinutes { get; set; } = 15;
		public OtpSetting Otp { get; set; } = new();
		public GitHubAuthSetting GitHubAuth { get; set; } = new();
		public GoogleAuthSetting GoogleAuth { get; set; } = new();
	}

	public class OtpSetting
	{
		public int CodeLength { get; set; } = 5;
		public int ExpirationSeconds { get; set; } = 120;
		public int MaxAttempts { get; set; } = 3;
		public int ResendCooldownSeconds { get; set; } = 60;

		public SmsSetting Sms { get; set; } = new();
	}

	public class SmsSetting
	{
		public string BaseUrl { get; set; } = "https://s.api.ir";
		public string OtpEndpoint { get; set; } = "/api/sw1/SmsOTP";
		public string AuthToken { get; set; } = string.Empty;
		public int Template { get; set; } = 1;
	}

	public class GitHubAuthSetting
	{
		public string ClientId { get; set; } = string.Empty;
		public string ClientSecret { get; set; } = string.Empty;
	}

	public class GoogleAuthSetting
	{
		public string ClientId { get; set; } = string.Empty;
		public string ClientSecret { get; set; } = string.Empty;
	}

	public class JwtSetting
	{
		public string Issuer { get; set; } = "Pishkar";
		public string Audience { get; set; } = "PishkarUsers";
		public string PublicKey { get; set; } = string.Empty;
		public string PrivateKey { get; set; } = string.Empty;
		public int AccessTokenExpirationMinutes { get; set; } = 60;
		public int RefreshTokenExpirationDays { get; set; } = 1;
	}

	public class OpenApiSetting
	{
		public string Title { get; set; } = "Server.WebAPI";
		public string Version { get; set; } = "v1";
	}

	public class PromptSetting
	{
		// Add-Prompts-Place

		public string Version { get; set; } = "v1";

		public string Introduction { get; set; } = """
			You are Piskar, an AI assistant that helps users with their questions and provides accurate information based on your knowledge base. 
			Always be polite and respectful in your responses.
			""";
		public string IntentDetection { get; set; } = """
			Determine the user's intent based on their query. 
			Possible intents include 'set_alarm', 'set_calendar', or 'general_query'. 
			Respond with only the intent name.
			""";

		public string SetAlarm { get; set; } = "Set an alarm for {time}.";
		public string SetCalendar { get; set; } = "Create a calendar event titled '{title}' on {date} at {time}.";
		public string MakeCall { get; set; } = string.Empty;
		public string SendSMS { get; set; } = string.Empty;
		public string SendEmail { get; set; } = string.Empty;
		public string ConsultingOnBuy { get; set; } = string.Empty;
	}

	public class InternalIntentDetector
	{
		public bool Enable { get; set; } = false;
		public List<string> SetAlarm { get; set; } = new();
		public List<string> SetCalendar { get; set; } = new();
	}

	public class OpenWebUISetting
	{
		public string BaseUrl { get; set; } = "http://103.130.147.29:8080"; // e.g. http://localhost:8080
		public string? ApiKey { get; set; } = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZiYjc3ZmQ3LTJhNWMtNDFmMy1iYTE3LWY1YzA4NDZiODk4NyIsImV4cCI6MTc2Njc2NjY4MCwianRpIjoiZWFjZjc0ZGUtOTk0OS00NzgyLTkxZWUtNzAwOWNkNDc1ZWVlIn0.ZOIe0BSghVi5Lo0vbA14hiG3TV_YwFHCOzSYgJ3l8Ew";
		public string ModelName { get; set; } = "gpt-oss-120b"; // gpt-oss-120b  OpenAI: gpt-oss-20b
		public string ChatExistsPath { get; set; } = "/api/chats/{chatId}";
		public string CreateChatPath { get; set; } = "/api/chats";
		public string SendMessagePath { get; set; } = "/api/chats/{chatId}/messages";
		public string DefaultChatNamePrefix { get; set; } = "Chat-";
	}

	public class OpenTelemetrySetting
	{
		public bool Enabled { get; set; } = false;
		public bool Tracing { get; set; } = true;
		public bool Metrics { get; set; } = false;
		public string ServiceName { get; set; } = "Server.WebAPI";
		public List<string> Sources { get; set; } = new();
	}

	public class JaegerSetting
	{
		public string Url { get; set; } = "http://localhost:4317";
	}

	public class NaturalLanguageGeneratorSetting
	{
		public bool Enable { get; set; } = false;
	}
}
