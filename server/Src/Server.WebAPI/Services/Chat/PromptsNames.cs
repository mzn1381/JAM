namespace Server.WebAPI.Services.Chat
{
	public static class PromptsNames
	{
		// Add-Prompts-Place

		public const string None = "none";
		public const string Introduction = "introduction"; // system
		public const string IntentDetector = "intent_detector";

		public const string SetAlarm = "set_alarm";
		public const string MakeCall = "make_call";
		public const string SendSMS = "send_sms";
		public const string SendEmail = "send_email";
		public const string ConsultingOnBuy = "consulting_on_buy";
		public const string SetCalendar = "set_calendar";

		public const string NaturalLanguageGenerator = "natural_language_generator";
		public const string Explainer = "explainer";
		public const string Pishkar = "pishkar";

		// tools
		public const string MessageToUser = "message_to_user";


		public static List<string> AllPrompts { get; set; } = new List<string>
		{
			None,
			Introduction,
			IntentDetector,
			SetAlarm,
			MakeCall,
			SendSMS,
			SendEmail,
			ConsultingOnBuy,
			SetCalendar
		};

		public static bool IsValidPrompt(string promptName)
		{
			if(string.IsNullOrEmpty(promptName))
				return true;

			return AllPrompts.Contains(promptName);
		}
	}
}
