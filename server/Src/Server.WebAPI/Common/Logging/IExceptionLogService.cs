using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.SystemLogs;

namespace Server.WebAPI.Common.Logging
{
	public interface IExceptionLogService : IScopedService
	{
		Task LogExceptionAsync(ExceptionLog exceptionLog);
		Task<ExceptionLog?> GetByTraceIdAsync(string traceId);
		Task<DataList<ExceptionLog>> GetLogsAsync(int page, int pageSize);
	}

	public class DataList<T>
	{
		public List<T> Items { get; set; } = [];
		public int TotalCount { get; set; }
		public int Page { get; set; }
		public int PageSize { get; set; }
		public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
		public bool HasPreviousPage => Page > 1;
		public bool HasNextPage => Page < TotalPages;
	}
}
