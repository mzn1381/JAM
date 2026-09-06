using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Models.Metadata;
using Server.WebAPI.Services.MetaData;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	//[Authorize]
	public class ChatMetadataController : ControllerBase
	{
		private readonly IChatMetaDataService _service;

		public ChatMetadataController(IChatMetaDataService service)
		{
			_service = service;
		}

		[HttpGet]
		public async Task<ActionResult<IReadOnlyList<ChatMetadata>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
		{
			var (items, total) = await _service.GetAllAsync(page, pageSize, cancellationToken);
			Response.Headers["X-Total-Count"] = total.ToString();
			Response.Headers["X-Page"] = page.ToString();
			Response.Headers["X-Page-Size"] = pageSize.ToString();
			return Ok(items);
		}

		[HttpGet("{conversationId}")]
		public async Task<ActionResult<ChatMetadata>> GetByConversationId(string conversationId, CancellationToken cancellationToken)
		{
			var metadata = await _service.GetByConversationIdAsync(conversationId, cancellationToken);
			if (metadata is null) return NotFound();
			return Ok(metadata);
		}

		[HttpGet("trace/{traceId}")]
		public async Task<ActionResult<ChatMetadata>> GetByTraceId(string traceId, CancellationToken cancellationToken)
		{
			var metadata = await _service.GetByTraceIdAsync(traceId, cancellationToken);
			if (metadata is null) return NotFound();
			return Ok(metadata);
		}

		[HttpPost]
		public async Task<ActionResult> Upsert([FromBody] ChatMetadata metadata, CancellationToken cancellationToken)
		{
			if (string.IsNullOrWhiteSpace(metadata.ConversationId))
			{
				return BadRequest("conversationId is required");
			}
			await _service.UpsertAsync(metadata, cancellationToken);
			return NoContent();
		}

		[HttpDelete("{conversationId}")]
		public async Task<ActionResult> Delete(string conversationId, CancellationToken cancellationToken)
		{
			var deleted = await _service.DeleteByConversationIdAsync(conversationId, cancellationToken);
			if (!deleted) return NotFound();
			return NoContent();
		}
	}
}
