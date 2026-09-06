using Server.WebAPI.Services.Chat.Regex;



namespace Server.WebAPI.Services.Chat.IntetDetector
{
	public class InternalntentDetector : IInternalIntentDetector
	{
		private readonly ILogger<InternalntentDetector> _logger;
		private readonly IRegexService _regexService;

		// TODO:
		private readonly List<string> _splitWords = 
		[
			"و", "هم", "بعد", "سپس", "و همچنین", "همچنین", "بعدش"
		];

		public InternalntentDetector(ILogger<InternalntentDetector> logger, IRegexService regexService)
		{
			_logger = logger;
			_regexService = regexService;
		}
		public InternalIntentResultDto DetectIntentAsync(string text, CancellationToken cancellationToken = default)
		{
			var chunks = SplitText(text);
			var results = new List<InternalIntentResultDto>();

			foreach(var chunk in chunks)
			{
				var best = DetectIntentInChunk(chunk);
				if(best.Confidence > 0.0)
					results.Add(best);
			}

			return results.MaxBy(i => i.Confidence) ?? new();
		}

		private InternalIntentResultDto DetectIntentInChunk(string chunk)
		{
			var best = new InternalIntentResultDto
			{
				Intent = PromptsNames.None,
				Message = chunk,
				Confidence = 0
			};

			var intetsList = new List<string>() { PromptsNames.SetCalendar, PromptsNames.SetAlarm };

			foreach(var intent in intetsList)
			{
				foreach(var pattern in _regexService.GetRegexConfig(intent))
				{
					var match = pattern.Match(chunk);
					if(match.Success)
					{
						string matchText = match.Value;
						double conf = matchText.Length / (chunk.Length + 1e-6);

						if(conf > best.Confidence)
						{
							best.Intent = intent;
							best.Message = matchText;
							best.Confidence = (float)Math.Round(conf, 2);
						}
					}
				}
			}

			return best;
		}

		private List<string> SplitText(string text)
		{

			text = text.Trim().ToLower();
			string connectorPattern = string.Join("|",
				_splitWords.Select(w => $@"\b{System.Text.RegularExpressions.Regex.Escape(w)}\b"));

			string punctuationPattern = @"[.,،؛]";

			string splitRegex = $@"\s*(?:{connectorPattern}|{punctuationPattern})\s*";

			return System.Text.RegularExpressions.Regex.Split(text, splitRegex)
						.Where(c => !string.IsNullOrWhiteSpace(c))
						.Select(c => c.Trim())
						.ToList();
		}
	}
}








