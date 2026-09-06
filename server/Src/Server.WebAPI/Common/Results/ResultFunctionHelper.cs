namespace Server.WebAPI.Common.Results
{
	public static class ResultFunctionHelper
	{
		public static ResultFunction<T> Success<T>(T data, string message = "")
		{
			return new ResultFunction<T>
			{
				Date = data,
				Success = true,
				Message = message
			};
		}

		public static ResultFunction Success(string message = "")
		{
			return new ResultFunction
			{
				Success = true,
				Message = message
			};
		}

		public static ResultFunction<T> Error<T>(T data = default!, string message = "")
		{
			return new ResultFunction<T>
			{
				Date = default!,
				Success = false,
				Message = message
			};
		}

		public static ResultFunction Error(string message = "")
		{
			return new ResultFunction
			{
				Success = false,
				Message = message
			};
		}
	}
}
