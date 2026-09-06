"""Persist unhandled/handled exceptions to MongoDB for observability.

Exposes `log_exception(...)` which builds a structured document from a FastAPI
Request + Exception and stores it in the `exception_logs` collection. All
failures inside the logger are swallowed so exception logging never masks the
original error being handled.
"""
from __future__ import annotations

import asyncio
import os
import traceback
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from opentelemetry import trace
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.chat.logger import get_logger, get_trace_id


logger = get_logger("exception_logger")

_MAX_BODY_BYTES = 16 * 1024  # 16 KiB safety cap for stored request bodies
_COLLECTION_NAME = "exception_logs"

_client: MongoClient | None = None
_db: Database | None = None
_collection: Collection | None = None
_init_failed: bool = False


def _get_collection() -> Collection | None:
    """Return the exception_logs collection, initializing lazily on first use.

    Returns None if MongoDB is not configured or initialization fails so
    callers can gracefully skip persistence.
    """
    global _client, _db, _collection, _init_failed
    if _collection is not None:
        return _collection
    if _init_failed:
        return None
    try:
        mongodb_uri = os.getenv("MONGODB_URI", "").strip()
        if not mongodb_uri:
            _init_failed = True
            return None
        database_name = os.getenv("MONGODB_DATABASE", "pishkar_ai")
        _client = MongoClient(mongodb_uri, retryWrites=True)
        _db = _client[database_name]
        _collection = _db[_COLLECTION_NAME]
        try:
            _collection.create_index("traceId")
            _collection.create_index("createdAt")
        except Exception:  # pragma: no cover - index best-effort
            logger.debug("Could not create indexes on %s", _COLLECTION_NAME, exc_info=True)
        return _collection
    except Exception:
        logger.exception("Failed to initialize MongoDB for exception logging")
        _init_failed = True
        return None


def _get_span_ids() -> tuple[str | None, str, str]:
    """Return (spanId, parentSpanId, traceId) as hex strings."""
    span = trace.get_current_span()
    ctx = span.get_span_context()
    trace_id = get_trace_id()
    if not ctx.is_valid:
        return None, "0000000000000000", trace_id or ""
    span_id = format(ctx.span_id, "016x")
    parent = getattr(span, "parent", None)
    parent_span_id = (
        format(parent.span_id, "016x") if parent and parent.span_id else "0000000000000000"
    )
    return span_id, parent_span_id, trace_id or ""


def _exception_source(exc: BaseException) -> str:
    """Best-effort source (module:file:line) where the exception was raised."""
    tb = exc.__traceback__
    if tb is None:
        return ""
    while tb.tb_next is not None:
        tb = tb.tb_next
    frame = tb.tb_frame
    filename = frame.f_code.co_filename
    lineno = tb.tb_lineno
    return f"{frame.f_globals.get('__name__', '')}:{filename}:{lineno}"


def _inner_exception(exc: BaseException) -> dict[str, Any] | None:
    inner = exc.__cause__ or exc.__context__
    if inner is None or inner is exc:
        return None
    return {
        "message": str(inner),
        "exceptionType": type(inner).__name__,
        "stackTrace": "".join(
            traceback.format_exception(type(inner), inner, inner.__traceback__)
        ),
        "source": _exception_source(inner),
    }


async def _safe_read_body(request: Request) -> str | None:
    try:
        body = await request.body()
        if not body:
            return None
        truncated = body[:_MAX_BODY_BYTES]
        try:
            return truncated.decode("utf-8", errors="replace")
        except Exception:
            return repr(truncated)
    except Exception:
        return None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return ""


def _build_document(
    request: Request,
    exc: BaseException,
    *,
    message: str,
    additional_data: dict[str, Any] | None,
    request_body: str | None,
) -> dict[str, Any]:
    span_id, parent_span_id, trace_id = _get_span_ids()
    now = datetime.now(timezone.utc)
    return {
        "id": str(uuid.uuid4()),
        "message": message,
        "stackTrace": "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
        "source": _exception_source(exc),
        "exceptionType": type(exc).__name__,
        "innerException": _inner_exception(exc),
        "requestPath": request.url.path,
        "requestMethod": request.method,
        "queryString": request.url.query or "",
        "requestBody": request_body,
        "userId": getattr(getattr(request, "state", None), "user_id", None),
        "ipAddress": _client_ip(request),
        "userAgent": request.headers.get("user-agent", ""),
        "traceId": trace_id or None,
        "spanId": span_id,
        "parentSpanId": parent_span_id,
        "additionalData": additional_data,
        "createdAt": now,
        "updatedAt": now,
        "isDeleted": False,
        "deletedAt": None,
    }


def _insert(document: dict[str, Any]) -> None:
    collection = _get_collection()
    if collection is None:
        return
    try:
        collection.insert_one(document)
    except Exception:
        logger.exception("Failed to persist exception log to MongoDB")


async def log_exception(
    request: Request,
    exc: BaseException,
    *,
    message: str | None = None,
    additional_data: dict[str, Any] | None = None,
) -> None:
    """Build and persist an exception log document. Never raises."""
    try:
        body = await _safe_read_body(request)
        document = _build_document(
            request,
            exc,
            message=message or (str(exc) or type(exc).__name__),
            additional_data=additional_data,
            request_body=body,
        )
        # Run the blocking insert off the event loop to avoid stalling handlers.
        await asyncio.to_thread(_insert, document)
    except Exception:
        logger.exception("Unexpected error while logging exception")
