namespace Server.WebAPI.Common.Results
{
	public class ResultFunction<T>
	{
		public T Date { get; set; } = default!;
		public bool Success { get; set; } = true;
		public string Message { get; set; } = string.Empty;

		public bool IsSuccessful => Success;
	}

	public class ResultFunction
	{
		public bool Success { get; set; } = true;
		public string Message { get; set; } = string.Empty;

		public bool IsSuccessful => Success;
	}
}
