from typing import Generic, TypeVar

from pydantic import BaseModel

from app.chat.logger import get_trace_id


T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Uniform response envelope for all REST endpoints."""

    data: T | None = None
    success: bool = True
    message: str = ""
    errorCode: int = 0
    traceId: str | None = None

    @classmethod
    def ok(cls, data: T | None = None, message: str = "") -> "ApiResponse[T]":
        return cls(
            data=data,
            success=True,
            message=message,
            errorCode=0,
            traceId=get_trace_id(),
        )

    @classmethod
    def fail(
        cls,
        message: str,
        error_code: int = 1,
        data: T | None = None,
    ) -> "ApiResponse[T]":
        return cls(
            data=data,
            success=False,
            message=message,
            errorCode=error_code,
            traceId=get_trace_id(),
        )
