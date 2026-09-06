using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.Metadata;

namespace Server.WebAPI.Services.MetaData
{
	public interface IChatMetaDataService : ITransientService
	{
		Task<ChatMetadata?> GetByConversationIdAsync(string conversationId, CancellationToken cancellationToken = default);
		Task<ChatMetadata?> GetByTraceIdAsync(string traceId, CancellationToken cancellationToken = default);
		Task UpsertAsync(ChatMetadata metadata, CancellationToken cancellationToken = default);
		Task<bool> DeleteByConversationIdAsync(string conversationId, CancellationToken cancellationToken = default);
		Task<(IReadOnlyList<ChatMetadata> Items, int TotalCount)> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken = default);
	}
}
