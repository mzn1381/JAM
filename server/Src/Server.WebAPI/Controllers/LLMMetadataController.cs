using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Common.Logging;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Models.Metadata;
using Server.WebAPI.Services.MetaData;

namespace Server.WebAPI.Controllers
{
	[Route("api/v1/[controller]")]
	[ApiController]
	//[Authorize]
	public class LLMMetadataController : ControllerBase
	{
		private readonly ILLMMetadataService _llmMetadataService;
		private readonly ILogger<LLMMetadataController> _logger;

		public LLMMetadataController(
			ILLMMetadataService llmMetadataService,
			ILogger<LLMMetadataController> logger)
		{
			_llmMetadataService = llmMetadataService;
			_logger = logger;
		}

		/// <summary>
		/// Get LLM metadata by TraceId
		/// </summary>
		/// <param name="traceId">The trace ID to search for</param>
		/// <returns>The LLM metadata record if found</returns>
		[HttpGet("trace/{traceId}")]
		[ProducesResponseType(typeof(ServiceResponse<LLMMetadata>), StatusCodes.Status200OK)]
		[ProducesResponseType(typeof(ServiceResponse<object>), StatusCodes.Status404NotFound)]
		[ProducesResponseType(typeof(ServiceResponse<object>), StatusCodes.Status400BadRequest)]
		public async Task<ActionResult<ServiceResponse<LLMMetadata>>> GetByTraceId(string traceId)
		{
			_logger.LogInformation("Getting LLM metadata by TraceId: {TraceId}", traceId);

			if (string.IsNullOrWhiteSpace(traceId))
			{
				return BadRequest(new ServiceResponse<LLMMetadata>
				{
					Success = false,
					Message = "TraceId is required",
					Data = null!
				});
			}

			var metadata = await _llmMetadataService.GetByTraceIdAsync(traceId);

			if (metadata == null)
			{
				return NotFound(new ServiceResponse<LLMMetadata>
				{
					Success = false,
					Message = $"No LLM metadata found for TraceId: {traceId}",
					Data = null!
				});
			}

			return Ok(new ServiceResponse<LLMMetadata>
			{
				Success = true,
				Message = "LLM metadata retrieved successfully",
				Data = metadata
			});
		}

		/// <summary>
		/// Get LLM metadata by ChatId with pagination
		/// </summary>
		/// <param name="chatId">The chat ID to search for</param>
		/// <param name="page">Page number (default: 1)</param>
		/// <param name="pageSize">Number of items per page (default: 10, max: 100)</param>
		/// <returns>Paginated list of LLM metadata for the chat</returns>
		[HttpGet("chat/{chatId}")]
		[ProducesResponseType(typeof(ServiceResponse<DataList<LLMMetadata>>), StatusCodes.Status200OK)]
		[ProducesResponseType(typeof(ServiceResponse<object>), StatusCodes.Status400BadRequest)]
		public async Task<ActionResult<ServiceResponse<DataList<LLMMetadata>>>> GetByChatId(
			string chatId,
			[FromQuery] int page = 1,
			[FromQuery] int pageSize = 10)
		{
			_logger.LogInformation("Getting LLM metadata by ChatId: {ChatId}. Page: {Page}, PageSize: {PageSize}", 
				chatId, page, pageSize);

			if (string.IsNullOrWhiteSpace(chatId))
			{
				return BadRequest(new ServiceResponse<DataList<LLMMetadata>>
				{
					Success = false,
					Message = "ChatId is required",
					Data = null!
				});
			}

			// Validate parameters
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;
			if (pageSize > 100) pageSize = 100;

			var (items, totalCount) = await _llmMetadataService.GetByChatIdAsync(chatId, page, pageSize);

			return Ok(new ServiceResponse<DataList<LLMMetadata>>
			{
				Success = true,
				Message = $"Retrieved {items.Count} of {totalCount} LLM metadata records",
				Data = new DataList<LLMMetadata>
				{
					Items = items.ToList(),
					TotalCount = totalCount,
					Page = page,
					PageSize = pageSize
				}
			});
		}

		/// <summary>
		/// Get paginated list of all LLM metadata
		/// </summary>
		/// <param name="page">Page number (default: 1)</param>
		/// <param name="pageSize">Number of items per page (default: 10, max: 100)</param>
		/// <returns>Paginated list of LLM metadata</returns>
		[HttpGet]
		[ProducesResponseType(typeof(ServiceResponse<DataList<LLMMetadata>>), StatusCodes.Status200OK)]
		public async Task<ActionResult<ServiceResponse<DataList<LLMMetadata>>>> GetAll(
			[FromQuery] int page = 1,
			[FromQuery] int pageSize = 10)
		{
			_logger.LogInformation("Getting all LLM metadata. Page: {Page}, PageSize: {PageSize}", page, pageSize);

			// Validate parameters
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;
			if (pageSize > 100) pageSize = 100;

			var (items, totalCount) = await _llmMetadataService.GetAllAsync(page, pageSize);

			return Ok(new ServiceResponse<DataList<LLMMetadata>>
			{
				Success = true,
				Message = $"Retrieved {items.Count} of {totalCount} LLM metadata records",
				Data = new DataList<LLMMetadata>
				{
					Items = items.ToList(),
					TotalCount = totalCount,
					Page = page,
					PageSize = pageSize
				}
			});
		}
	}
}
