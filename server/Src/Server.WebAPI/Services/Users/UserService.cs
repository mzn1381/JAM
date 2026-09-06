using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Server.WebAPI.AppDbContext;
using Server.WebAPI.Common.Services;
using Server.WebAPI.Models.Users;
using Server.WebAPI.Services.Auth;

namespace Server.WebAPI.Services.Users
{
	public class UserService : IUserService
	{
		private readonly ServerDbContext _db;
		private readonly IPasswordHasher _passwordHasher;

		public UserService(ServerDbContext db, IPasswordHasher passwordHasher)
		{
			_db = db;
			_passwordHasher = passwordHasher;
		}

		private static UserDto ToDto(User u) => new UserDto
		{
			Id = u.Id,
			Username = u.Username,
			Email = u.Email,
			FirstName = u.FirstName,
			LastName = u.LastName,
			EmailVerified = u.EmailVerified,
			LastLoginAt = u.LastLoginAt
		};

		public async Task<ServiceResponse<List<UserDto>>> GetAllAsync(int page, int pageSize, CancellationToken cancellationToken = default)
		{
			if(page < 1) page = 1;
			if(pageSize < 1) pageSize = 10;

			var users = await _db.Users
				.Select(u => new UserDto
				{
					Id = u.Id,
					Username = u.Username,
					Email = u.Email,
					FirstName = u.FirstName,
					LastName = u.LastName,
					EmailVerified = u.EmailVerified,
					LastLoginAt = u.LastLoginAt
				})
				.Skip((page - 1) * pageSize).Take(pageSize)
				.ToListAsync();

			return new ServiceResponse<List<UserDto>> { Data = users };
		}

		public async Task<ServiceResponse<UserDto?>> GetByIdAsync(Guid id)
		{
			var dto = await _db.Users.AsNoTracking()
				.Where(u => u.Id == id)
				.Select(u => new UserDto
				{
					Id = u.Id,
					Username = u.Username,
					Email = u.Email,
					FirstName = u.FirstName,
					LastName = u.LastName,
					EmailVerified = u.EmailVerified,
					LastLoginAt = u.LastLoginAt
				})
				.FirstOrDefaultAsync();

			return new ServiceResponse<UserDto?> 
			{ 
				Data = dto, 
				Success = dto != null, 
				Message = dto != null ? string.Empty : "User not found",
				ErrorCode = dto != null ? ErrorCode.None : ErrorCode.NotFound
			};
		}

		public async Task<ServiceResponse<UserDto>> CreateAsync(CreateUserDto user)
		{
			// Validate password
			var passwordValidation = ValidatePassword(user.Password);
			if (!passwordValidation.IsValid)
			{
				return new ServiceResponse<UserDto>
				{
					Data = null!,
					Success = false,
					Message = passwordValidation.ErrorMessage,
					ErrorCode = ErrorCode.ValidationError
				};
			}

			// Check for existing username or email
			var existingUser = await _db.Users
				.FirstOrDefaultAsync(u => u.Username == user.Username || u.Email == user.Email);
			
			if (existingUser != null)
			{
				return new ServiceResponse<UserDto>
				{
					Data = null!,
					Success = false,
					Message = existingUser.Username == user.Username 
						? "Username already exists" 
						: "Email already exists",
					ErrorCode = ErrorCode.Conflict
				};
			}

			var entity = new User
			{
				Username = user.Username,
				Email = user.Email,
				PasswordHash = _passwordHasher.HashPassword(user.Password),
				FirstName = user.FirstName,
				LastName = user.LastName
			};

			_db.Users.Add(entity);
			await _db.SaveChangesAsync();

			return new ServiceResponse<UserDto> { Data = ToDto(entity) };
		}

		public async Task<ServiceResponse<UserDto?>> UpdateAsync(Guid id, UpdateUserDto user)
		{
			var existing = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
			if (existing == null)
				return new ServiceResponse<UserDto?> 
				{ 
					Data = null, 
					Success = false, 
					Message = "User not found",
					ErrorCode = ErrorCode.NotFound
				};

			// Check for duplicate username or email (excluding current user)
			var duplicate = await _db.Users
				.FirstOrDefaultAsync(u => u.Id != id && (u.Username == user.Username || u.Email == user.Email));
			
			if (duplicate != null)
			{
				return new ServiceResponse<UserDto?>
				{
					Data = null,
					Success = false,
					Message = duplicate.Username == user.Username
						? "Username already exists"
						: "Email already exists",
					ErrorCode = ErrorCode.Conflict
				};
			}

			existing.Username = user.Username;
			existing.Email = user.Email;
			existing.FirstName = user.FirstName;
			existing.LastName = user.LastName;
			existing.UpdatedAt = DateTime.UtcNow;

			await _db.SaveChangesAsync();
			return new ServiceResponse<UserDto?> { Data = ToDto(existing) };
		}

		public async Task<ServiceResponse<bool>> DeleteAsync(Guid id)
		{
			var existing = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
			if (existing == null)
				return new ServiceResponse<bool> 
				{ 
					Data = false, 
					Success = false, 
					Message = "User not found",
					ErrorCode = ErrorCode.NotFound
				};

			_db.Users.Remove(existing);
			await _db.SaveChangesAsync();
			return new ServiceResponse<bool> { Data = true };
		}

		public async Task<ServiceResponse<bool>> ChangePasswordAsync(Guid id, ChangePasswordDto dto)
		{
			var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
			if (user == null)
				return new ServiceResponse<bool> 
				{ 
					Data = false, 
					Success = false, 
					Message = "User not found",
					ErrorCode = ErrorCode.NotFound
				};

			// Verify current password
			if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
			{
				return new ServiceResponse<bool>
				{
					Data = false,
					Success = false,
					Message = "Current password is incorrect",
					ErrorCode = ErrorCode.Unauthorized
				};
			}

			// Validate new password
			var passwordValidation = ValidatePassword(dto.NewPassword);
			if (!passwordValidation.IsValid)
			{
				return new ServiceResponse<bool>
				{
					Data = false,
					Success = false,
					Message = passwordValidation.ErrorMessage,
					ErrorCode = ErrorCode.ValidationError
				};
			}

			// Update password
			user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
			user.UpdatedAt = DateTime.UtcNow;

			await _db.SaveChangesAsync();

			return new ServiceResponse<bool>
			{
				Data = true,
				Success = true,
				Message = "Password changed successfully"
			};
		}

		private static (bool IsValid, string ErrorMessage) ValidatePassword(string password)
		{
			if (string.IsNullOrWhiteSpace(password))
				return (false, "Password is required");

			if (password.Length < 8)
				return (false, "Password must be at least 8 characters long");

			if (password.Length > 128)
				return (false, "Password must not exceed 128 characters");

			if (!password.Any(char.IsUpper))
				return (false, "Password must contain at least one uppercase letter");

			if (!password.Any(char.IsLower))
				return (false, "Password must contain at least one lowercase letter");

			if (!password.Any(char.IsDigit))
				return (false, "Password must contain at least one digit");

			if (!password.Any(c => !char.IsLetterOrDigit(c)))
				return (false, "Password must contain at least one special character");

			return (true, string.Empty);
		}
	}
}
