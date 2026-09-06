using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Logging;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Models.SystemLogs;

namespace Server.WebAPI.Controllers
{
	[Route("api/v1/[controller]")]
	[ApiController]
	//[Authorize]
	public class ExceptionLogsController : ControllerBase
	{
		private readonly IExceptionLogService _exceptionLogService;
		private readonly ILogger<ExceptionLogsController> _logger;

		public ExceptionLogsController(
			IExceptionLogService exceptionLogService,
			ILogger<ExceptionLogsController> logger)
		{
			_exceptionLogService = exceptionLogService;
			_logger = logger;
		}

		/// <summary>
		/// Get exception log by TraceId
		/// </summary>
		/// <param name="traceId">The trace ID to search for</param>
		/// <returns>The exception log record if found</returns>
		[HttpGet("trace/{traceId}")]
		[ProducesResponseType(typeof(ServiceResponse<ExceptionLog>), StatusCodes.Status200OK)]
		[ProducesResponseType(typeof(ServiceResponse<object>), StatusCodes.Status404NotFound)]
		public async Task<ActionResult<ServiceResponse<ExceptionLog>>> GetByTraceId(string traceId)
		{
			_logger.LogInformation("Getting exception log by TraceId: {TraceId}", traceId);

			if (string.IsNullOrWhiteSpace(traceId))
			{
				return BadRequest(new ServiceResponse<ExceptionLog>
				{
					Success = false,
					Message = "TraceId is required",
					Data = null!
				});
			}

			var log = await _exceptionLogService.GetByTraceIdAsync(traceId);

			if (log == null)
			{
				return NotFound(new ServiceResponse<ExceptionLog>
				{
					Success = false,
					Message = $"No exception log found for TraceId: {traceId}",
					Data = null!
				});
			}

			return Ok(new ServiceResponse<ExceptionLog>
			{
				Success = true,
				Message = "Exception log retrieved successfully",
				Data = log
			});
		}

		/// <summary>
		/// Get paginated list of exception logs
		/// </summary>
		/// <param name="page">Page number (default: 1)</param>
		/// <param name="pageSize">Number of items per page (default: 10, max: 100)</param>
		/// <returns>Paginated list of exception logs</returns>
		[HttpGet]
		[ProducesResponseType(typeof(ServiceResponse<DataList<ExceptionLog>>), StatusCodes.Status200OK)]
		public async Task<ActionResult<ServiceResponse<DataList<ExceptionLog>>>> GetLogs(
			[FromQuery] int page = 1,
			[FromQuery] int pageSize = 10)
		{
			_logger.LogInformation("Getting exception logs. Page: {Page}, PageSize: {PageSize}", page, pageSize);

			// Validate parameters
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;
			if (pageSize > 100) pageSize = 100; // Max page size limit

			var result = await _exceptionLogService.GetLogsAsync(page, pageSize);

			return Ok(new ServiceResponse<DataList<ExceptionLog>>
			{
				Success = true,
				Message = $"Retrieved {result.Items.Count} of {result.TotalCount} exception logs",
				Data = result
			});
		}
	}
}
