using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.WebAPI.Services.OpenAPI.LLMModel;

namespace Server.WebAPI.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    //[Authorize]
    public class LLMModelController : ControllerBase
    {
        private readonly ILLMModelConfigService _llmModelConfigService;
        private readonly ILogger<LLMModelController> _logger;

        public LLMModelController(ILLMModelConfigService llmModelConfigService,
            ILogger<LLMModelController> logger)
        {
            _llmModelConfigService = llmModelConfigService;
            _logger = logger;
        }

        // GET api/v1/LLMModel
        [HttpGet]
        public ActionResult<string> Get()
        {
            var modelName = _llmModelConfigService.GetLLMModelName();
            if (string.IsNullOrWhiteSpace(modelName))
            {
                return NotFound("Model name not set");
            }
            return Ok(modelName);
        }

        // POST api/v1/LLMModel
        [HttpPost]
        public IActionResult Set([FromBody] SetModelRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ModelName))
            {
                return BadRequest("ModelName is required");
            }

            _llmModelConfigService.SetLLMModel(request.ModelName);
            _logger.LogInformation("LLM model set to {Model}", request.ModelName);
            return NoContent();
        }

        public class SetModelRequest
        {
            public string ModelName { get; set; } = string.Empty;
        }
    }
}
