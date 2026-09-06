using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Common.Services;

namespace Server.WebAPI.Services.Users
{
	public interface IUserService : ITransientService
	{
		Task<ServiceResponse<List<UserDto>>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken = default);
		Task<ServiceResponse<UserDto?>> GetByIdAsync(Guid id);
		Task<ServiceResponse<UserDto>> CreateAsync(CreateUserDto user);
		Task<ServiceResponse<UserDto?>> UpdateAsync(Guid id, UpdateUserDto user);
		Task<ServiceResponse<bool>> DeleteAsync(Guid id);
		Task<ServiceResponse<bool>> ChangePasswordAsync(Guid id, ChangePasswordDto dto);
	}

	public class UserDto
	{
		public Guid Id { get; set; }
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
		public bool EmailVerified { get; set; }
		public DateTime? LastLoginAt { get; set; }
	}

	public class CreateUserDto
	{
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string Password { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public class UpdateUserDto
	{
		public string Username { get; set; } = string.Empty;
		public string Email { get; set; } = string.Empty;
		public string? FirstName { get; set; }
		public string? LastName { get; set; }
	}

	public class ChangePasswordDto
	{
		public string CurrentPassword { get; set; } = string.Empty;
		public string NewPassword { get; set; } = string.Empty;
	}
}
