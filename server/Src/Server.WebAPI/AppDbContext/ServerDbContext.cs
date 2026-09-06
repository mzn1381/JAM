using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;
using Server.WebAPI.Models.Auth;
using Server.WebAPI.Models.Chat;
using Server.WebAPI.Models.Metadata;
using Server.WebAPI.Models.SystemLogs;
using Server.WebAPI.Models.Users;

namespace Server.WebAPI.AppDbContext
{
	public class ServerDbContext : DbContext
	{
		public ServerDbContext(DbContextOptions<ServerDbContext> options) : base(options)
		{
			Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
		}

		public DbSet<User> Users { get; set; }
		public DbSet<OtpVerification> OtpVerifications { get; set; }
		public DbSet<ChatMetadata> ChatMetadata { get; set; }
		public DbSet<LLMMetadata> LLMMetadata { get; set; }
		public DbSet<ExceptionLog> ExceptionLogs { get; set; }
		public DbSet<ChatContext> ChatContexts { get; set; }
		public DbSet<UserContext> UserContexts { get; set; }

		//protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		//{
		//	base.OnConfiguring(optionsBuilder);

		//	Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
		//}

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);

			// Configure MongoDB collections mapping
			modelBuilder.Entity<User>().ToCollection("users");
			modelBuilder.Entity<OtpVerification>().ToCollection("otp_verifications");
			modelBuilder.Entity<ChatMetadata>().ToCollection("chat_metadata");
			modelBuilder.Entity<LLMMetadata>().ToCollection("llm_metadata");
			modelBuilder.Entity<ExceptionLog>().ToCollection("exception_logs");
			modelBuilder.Entity<ChatContext>().ToCollection("chat_contexts");
			modelBuilder.Entity<UserContext>().ToCollection("user_contexts");
		}
	}
}
