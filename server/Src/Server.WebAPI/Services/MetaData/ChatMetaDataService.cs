using Microsoft.EntityFrameworkCore;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Models.Metadata;

namespace Server.WebAPI.Services.MetaData
{
	public class ChatMetaDataService : IChatMetaDataService
	{
		private readonly ServerDbContext _db;

		public ChatMetaDataService(ServerDbContext db)
		{
			_db = db;
		}

		// Return latest interaction document for a conversation
		public async Task<ChatMetadata?> GetByConversationIdAsync(string conversationId, CancellationToken cancellationToken = default)
		{
			return await _db.ChatMetadata.AsNoTracking()
				.Where(c => c.ConversationId == conversationId)
				.OrderByDescending(c => c.CreatedAt)
				.FirstOrDefaultAsync(cancellationToken);
		}

		// Return chat metadata by traceId
		public async Task<ChatMetadata?> GetByTraceIdAsync(string traceId, CancellationToken cancellationToken = default)
		{
			return await _db.ChatMetadata.AsNoTracking()
				.Where(c => c.TraceId == traceId)
				.OrderByDescending(c => c.CreatedAt)
				.FirstOrDefaultAsync(cancellationToken);
		}

		// Store each chat API call (input/output) as its own document; no update of previous entries
		public async Task UpsertAsync(ChatMetadata metadata, CancellationToken cancellationToken = default)
		{
			var now = DateTime.UtcNow;
			metadata.CreatedAt = metadata.CreatedAt == default ? now : metadata.CreatedAt;
			metadata.UpdatedAt = now;
			_db.ChatMetadata.Add(metadata);
			await _db.SaveChangesAsync(cancellationToken);
		}

		// Delete all interaction documents for a conversation id
		public async Task<bool> DeleteByConversationIdAsync(string conversationId, CancellationToken cancellationToken = default)
		{
			var existing = await _db.ChatMetadata
				.Where(c => c.ConversationId == conversationId)
				.ToListAsync(cancellationToken);
			if(existing.Count == 0)
			{
				return false;
			}
			_db.ChatMetadata.RemoveRange(existing);
			await _db.SaveChangesAsync(cancellationToken);
			return true;
		}

		// New: get all chat metadata with pagination ordered by CreatedAt desc
		public async Task<(IReadOnlyList<ChatMetadata> Items, int TotalCount)> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken = default)
		{
			if (page < 1) page = 1;
			if (pageSize < 1) pageSize = 10;

			var query = _db.ChatMetadata.AsNoTracking().OrderByDescending(c => c.CreatedAt);
			var total = await query.CountAsync(cancellationToken);
			var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(cancellationToken);
			return (items, total);
		}
	}
}
