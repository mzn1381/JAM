import os

from dotenv import load_dotenv

load_dotenv()

import app.observability.phoenix as _phoenix
from app.routers import all_routers
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from app.chat.logger import get_logger, get_trace_id
from app.observability.logging.exception_handlers import register_exception_handlers


logger = get_logger("app")


def _get_cors_origins() -> list[str]:
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "*",
    )
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["*"]


cors_origins = _get_cors_origins()
allow_cors_credentials = "*" not in cors_origins
logger.info("CORS origins configured: %s", cors_origins)

app = FastAPI(
    title="Pishkar AI",
    docs_url="/swagger/index.html",
    redoc_url=None,
    openapi_url="/swagger/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_cors_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Trace-Id"],
)


@app.middleware("http")
async def add_trace_id_header(request: Request, call_next):
    response = await call_next(request)
    trace_id = get_trace_id()
    if trace_id:
        response.headers["X-Trace-Id"] = trace_id
    return response

TRACING_EXCLUDED_URLS = "/health/ready,/health/live"

# Auto-create an OpenTelemetry span for every incoming HTTP request so that
# get_trace_id() returns a valid id inside handlers and middleware.
FastAPIInstrumentor.instrument_app(app, excluded_urls=TRACING_EXCLUDED_URLS)

# Register global exception handlers so every unhandled error is returned as a
# structured response instead of the default FastAPI/Starlette payload.
register_exception_handlers(app)

logger.info("app started!")

for r in all_routers:
    app.include_router(r)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )
    components = openapi_schema.setdefault("components", {})
    security_schemes = components.setdefault("securitySchemes", {})
    security_schemes["HTTPBearer"] = {
        "type": "http",
        "description": "Bearer <token>",
        "scheme": "bearer",
    }
    openapi_schema["security"] = [{"HTTPBearer": []}]

    for path_item in openapi_schema.get("paths", {}).values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation.setdefault("security", [{"HTTPBearer": []}])

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
