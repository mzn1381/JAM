using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Services.Chat.Regex;
using System.Collections.Generic;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	public class RegexConfigController : ControllerBase
	{
		private readonly IRegexService _regexService;

		public RegexConfigController(IRegexService regexService)
		{
			_regexService = regexService;
		}

		/// <summary>
		/// Gets the regex patterns for the specified regex name.
		/// </summary>
		/// <param name="regexName">The regex identifier (e.g., set_alarm, set_calendar).</param>
		/// <returns>List of regex patterns.</returns>
		[HttpGet("{regexName}")]
		public ActionResult<List<string>> GetRegex(string regexName)
		{
			var regexList = _regexService.GetRegexConfig(regexName);
			var patterns = regexList?.ConvertAll(r => r.ToString()) ?? new List<string>();
			return Ok(patterns);
		}

		/// <summary>
		/// Updates the regex patterns for the specified regex name.
		/// </summary>
		/// <param name="regexName">The regex identifier (e.g., set_alarm, set_calendar).</param>
		/// <param name="request">The new list of regex patterns.</param>
		/// <returns>No content on success.</returns>
		[HttpPut("{regexName}")]
		public IActionResult SetRegex(string regexName, [FromBody] SetRegexRequest request)
		{
			if (request is null || request.Patterns is null)
				return BadRequest("Regex patterns are required.");

			_regexService.SetRegexConfig(regexName, request.Patterns);
			return NoContent();
		}

		public class SetRegexRequest
		{
			public List<string> Patterns { get; set; } = new List<string>();
		}
	}
}
