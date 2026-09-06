using Microsoft.EntityFrameworkCore;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.SystemLogs;

namespace Server.WebAPI.Common.Logging
{
	public class ExceptionLogService : IExceptionLogService
	{
		private readonly ServerDbContext _dbContext;
		private readonly ILogger<ExceptionLogService> _logger;

		public ExceptionLogService(ServerDbContext dbContext, ILogger<ExceptionLogService> logger)
		{
			_dbContext = dbContext;
			_logger = logger;
		}

		public async Task LogExceptionAsync(ExceptionLog exceptionLog)
		{
			try
			{
				exceptionLog.CreatedAt = DateTime.UtcNow;
				exceptionLog.UpdatedAt = DateTime.UtcNow;

				await _dbContext.ExceptionLogs.AddAsync(exceptionLog);
				await _dbContext.SaveChangesAsync();

				_logger.LogInformation("Exception logged to MongoDB with Id: {Id}, TraceId: {TraceId}", 
					exceptionLog.Id, exceptionLog.TraceId);
			}
			catch (Exception ex)
			{
				// If we can't log to MongoDB, at least log to console
				_logger.LogError(ex, "Failed to log exception to MongoDB. Original exception: {Message}", exceptionLog.Message);
			}
		}

		public async Task<ExceptionLog?> GetByTraceIdAsync(string traceId)
		{
			try
			{
				return await _dbContext.ExceptionLogs
					.Where(e => e.TraceId == traceId && !e.IsDeleted)
					.OrderByDescending(e => e.CreatedAt)
					.FirstOrDefaultAsync();
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to get exception log by TraceId: {TraceId}", traceId);
				return null;
			}
		}

		public async Task<DataList<ExceptionLog>> GetLogsAsync(int page, int pageSize)
		{
			try
			{
				var query = _dbContext.ExceptionLogs
					.Where(e => !e.IsDeleted)
					.OrderByDescending(e => e.CreatedAt);

				var totalCount = await query.CountAsync();
				
				var items = await query
					.Skip((page - 1) * pageSize)
					.Take(pageSize)
					.ToListAsync();

				return new DataList<ExceptionLog>
				{
					Items = items,
					TotalCount = totalCount,
					Page = page,
					PageSize = pageSize
				};
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, "Failed to get exception logs. Page: {Page}, PageSize: {PageSize}", page, pageSize);
				return new DataList<ExceptionLog>
				{
					Items = [],
					TotalCount = 0,
					Page = page,
					PageSize = pageSize
				};
			}
		}
	}
}
