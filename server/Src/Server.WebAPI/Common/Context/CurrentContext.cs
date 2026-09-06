using Server.WebAPI.Common.DependencyInjection;
using Server.WebAPI.Models.Auth;
using System.Security.Claims;

namespace Server.WebAPI.Common.Context
{
	public interface ICurrentContext : IScopedService
	{
		bool IsAuthenticated { get; }
		ServerUser? User { get; }
		Guid UserId { get; }
	}

	public class CurrentContext : ICurrentContext
	{
		private readonly IHttpContextAccessor _httpContextAccessor;
		private ServerUser? _user;
		private bool _userLoaded;

		public CurrentContext(IHttpContextAccessor httpContextAccessor)
		{
			_httpContextAccessor = httpContextAccessor;
		}

		public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;

		public Guid UserId
		{
			get
			{
				var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
				return Guid.TryParse(userIdClaim, out var userId) ? userId : Guid.Empty;
			}
		}

		public ServerUser? User
		{
			get
			{
				if (_userLoaded)
					return _user;

				_userLoaded = true;

				if (!IsAuthenticated)
					return null;

				var claims = _httpContextAccessor.HttpContext?.User;
				if (claims == null)
					return null;

				_user = new ServerUser
				{
					Id = UserId,
					Username = claims.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty,
					Email = claims.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty,
					FirstName = claims.FindFirst(ClaimTypes.GivenName)?.Value,
					LastName = claims.FindFirst(ClaimTypes.Surname)?.Value,
					Roles = claims.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList()
				};

				if(_user.Id == Guid.Empty)
				{
					_user = null;
				}

				return _user;
			}
		}
	}
}
