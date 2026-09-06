import traceback
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.chat.logger import get_logger, get_trace_id
from app.core.environment import show_security_info
from app.observability.logging.exception_logging import log_exception


logger = get_logger("exception_handler")

_GENERIC_SERVER_ERROR_MESSAGE = "An internal server error occurred. Please try again later."


class ErrorResponse(BaseModel):
    data: Any | None = None
    success: bool = False
    message: str = ""
    errorCode: int = 0
    traceId: str | None = None


def _build_error_payload(message: str, error_code: int) -> dict:
    payload = ErrorResponse(
        data=None,
        success=False,
        message=message,
        errorCode=error_code,
        traceId=get_trace_id(),
    )
    return jsonable_encoder(payload)


def _format_exception_message(exc: Exception) -> str:
    """Return a full stack trace outside production; otherwise a constant message."""
    if show_security_info():
        return _GENERIC_SERVER_ERROR_MESSAGE
    return "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))


async def _unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception at %s %s", request.method, request.url.path)
    await log_exception(request, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_build_error_payload(
            message=_format_exception_message(exc),
            error_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        ),
    )


async def _http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    logger.warning(
        "HTTP exception at %s %s -> %s: %s",
        request.method,
        request.url.path,
        exc.status_code,
        exc.detail,
    )
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    await log_exception(
        request,
        exc,
        message=message,
        additional_data={"statusCode": exc.status_code},
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error_payload(message=message, error_code=exc.status_code),
    )


async def _validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    logger.warning(
        "Validation error at %s %s: %s",
        request.method,
        request.url.path,
        exc.errors(),
    )
    if show_security_info():
        message = "Invalid request payload."
    else:
        message = str(exc.errors())
    await log_exception(
        request,
        exc,
        message="Request validation failed",
        additional_data={"errors": exc.errors()},
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_build_error_payload(
            message=message,
            error_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers producing structured error responses."""
    app.add_exception_handler(RequestValidationError, _validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
