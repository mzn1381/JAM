using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.Metadata;

namespace Server.WebAPI.Services.MetaData
{
	/// <summary>
	/// Service for logging and retrieving raw LLM API call metadata.
	/// </summary>
	public interface ILLMMetadataService : ITransientService
	{
		/// <summary>
		/// Logs LLM metadata to the database.
		/// </summary>
		Task LogAsync(LLMMetadata metadata, CancellationToken cancellationToken = default);

		/// <summary>
		/// Gets LLM metadata by trace ID.
		/// </summary>
		Task<LLMMetadata?> GetByTraceIdAsync(string traceId, CancellationToken cancellationToken = default);

		/// <summary>
		/// Gets LLM metadata by chat ID with pagination.
		/// </summary>
		Task<(IReadOnlyList<LLMMetadata> Items, int TotalCount)> GetByChatIdAsync(
			string chatId, 
			int page = 1, 
			int pageSize = 10, 
			CancellationToken cancellationToken = default);

		/// <summary>
		/// Gets all LLM metadata with pagination.
		/// </summary>
		Task<(IReadOnlyList<LLMMetadata> Items, int TotalCount)> GetAllAsync(
			int page = 1, 
			int pageSize = 10, 
			CancellationToken cancellationToken = default);
	}
}
