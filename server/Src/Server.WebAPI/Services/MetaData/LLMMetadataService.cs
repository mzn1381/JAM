using Microsoft.EntityFrameworkCore;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Metadata;

namespace Server.WebAPI.Services.MetaData
{
	/// <summary>
	/// Service for logging and retrieving raw LLM API call metadata.
	/// </summary>
	public class LLMMetadataService : ILLMMetadataService
	{
		private readonly ServerDbContext _db;
		private readonly ILogger<LLMMetadataService> _logger;

		public LLMMetadataService(ServerDbContext db, ILogger<LLMMetadataService> logger)
		{
			_db = db;
			_logger = logger;
		}

		public async Task LogAsync(LLMMetadata metadata, CancellationToken cancellationToken = default)
		{
			try
			{
				var now = DateTime.UtcNow;
				metadata.CreatedAt = metadata.CreatedAt == default ? now : metadata.CreatedAt;
				metadata.UpdatedAt = now;

				_db.LLMMetadata.Add(metadata);
				await _db.SaveChangesAsync(cancellationToken);

				_logger.LogDebug(
					"LLM metadata logged. Id: {Id}, TraceId: {TraceId}, Model: {Model}, Tokens: {Tokens}, Duration: {Duration}ms",
					metadata.Id, metadata.TraceId, metadata.Model, metadata.TotalTokens, metadata.DurationMs);
			}
			catch (Exception ex)
			{
				_logger.LogError(ex, 
					"Failed to log LLM metadata. TraceId: {TraceId}, Model: {Model}", 
					metadata.TraceId, metadata.Model);
			}
		}

		public async Task<LLMMetadata?> GetByTraceIdAsync(string traceId, CancellationToken cancellationToken = default)
		{
			return await _db.LLMMetadata.AsNoTracking()
				.Where(m => m.TraceId == traceId && !m.IsDeleted)
				.OrderByDescending(m => m.CreatedAt)
				.FirstOrDefaultAsync(cancellationToken);
		}

		public async Task<(IReadOnlyList<LLMMetadata> Items, int TotalCount)> GetByChatIdAsync(
			string chatId, 
			int page = 1, 
			int pageSize = 10, 
			CancellationToken cancellationToken = default)
		{
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;

			var query = _db.LLMMetadata.AsNoTracking()
				.Where(m => m.ChatId == chatId && !m.IsDeleted)
				.OrderByDescending(m => m.CreatedAt);

			var total = await query.CountAsync(cancellationToken);
			var items = await query
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync(cancellationToken);

			return (items, total);
		}

		public async Task<(IReadOnlyList<LLMMetadata> Items, int TotalCount)> GetAllAsync(
			int page = 1, 
			int pageSize = 10, 
			CancellationToken cancellationToken = default)
		{
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;

			var query = _db.LLMMetadata.AsNoTracking()
				.Where(m => !m.IsDeleted)
				.OrderByDescending(m => m.CreatedAt);

			var total = await query.CountAsync(cancellationToken);
			var items = await query
				.Skip((page - 1) * pageSize)
				.Take(pageSize)
				.ToListAsync(cancellationToken);

			return (items, total);
		}
	}
}
