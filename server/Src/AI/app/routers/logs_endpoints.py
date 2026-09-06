from datetime import datetime
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from app.core.response_model import ApiResponse
from app.observability.logging.exception_logging import _get_collection


router = APIRouter(prefix="/api/v2/exceptionlogs", tags=["exception-logs"])


def _serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    return value


def _serialize_document(document: dict[str, Any]) -> dict[str, Any]:
    return {key: _serialize_value(value) for key, value in document.items()}


def _get_exception_logs_collection():
    collection = _get_collection()
    if collection is None:
        raise HTTPException(
            status_code=503,
            detail="Exception logging storage is not configured",
        )
    return collection


@router.get("/{traceid}", response_model=ApiResponse[dict[str, Any]])
def get_exception_logs_by_trace_id(traceid: str) -> ApiResponse[dict[str, Any]]:
    collection = _get_exception_logs_collection()
    query = {"traceId": traceid, "isDeleted": {"$ne": True}}
    documents = list(collection.find(query).sort("createdAt", -1))
    return ApiResponse.ok(
        data={
            "traceId": traceid,
            "count": len(documents),
            "items": [_serialize_document(document) for document in documents],
        }
    )


@router.get("", response_model=ApiResponse[dict[str, Any]])
def list_exception_logs(
    page: int = Query(default=1, ge=1),
    pagesize: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[dict[str, Any]]:
    collection = _get_exception_logs_collection()
    query = {"isDeleted": {"$ne": True}}
    skip = (page - 1) * pagesize

    total = collection.count_documents(query)
    documents = list(
        collection.find(query)
        .sort("createdAt", -1)
        .skip(skip)
        .limit(pagesize)
    )

    return ApiResponse.ok(
        data={
            "page": page,
            "pageSize": pagesize,
            "total": total,
            "items": [_serialize_document(document) for document in documents],
        }
    )
