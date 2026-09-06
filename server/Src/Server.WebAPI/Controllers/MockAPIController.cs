using Microsoft.AspNetCore.Mvc;

namespace Server.WebAPI.Controllers
{
	[ApiController]
	[Route("api/v1/[controller]")]
	public class MockAPIController : ControllerBase
	{
		[HttpPost("bill")]
		public IActionResult PowerBill([FromBody] PowerBillRequest request)
		{
			if (request == null || string.IsNullOrEmpty(request.BillID) || string.IsNullOrEmpty(request.Type))
			{
				return BadRequest("Invalid request body");
			}

			var response = new
			{
				data = new
				{
					amount = 150000,
					billID = request.BillID,
					payID = "987654321",
					date = "1404/01/01"
				},
				success = true,
				code = 1,
				error = (string?)null,
				message = (string?)null
			};

			return Ok(response);
		}

		public class PowerBillRequest
		{
			public string BillID { get; set; } = string.Empty;
			public string Type { get; set; } = string.Empty;
		}
	}
}
