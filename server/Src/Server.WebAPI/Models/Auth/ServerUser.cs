namespace Server.WebAPI.Models.Auth
{
	public class ServerUser
	{
		public Guid Id { get; set; }
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
		public List<string> Roles { get; set; } = new();

		public string FullName => string.IsNullOrWhiteSpace(FirstName) && string.IsNullOrWhiteSpace(LastName)
			? Username
			: $"{FirstName} {LastName}".Trim();
	}
}
