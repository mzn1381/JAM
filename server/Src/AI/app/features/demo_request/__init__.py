from app.features.demo_request.demo_request_infrastructure import (
    ensure_demo_request_indexes,
    get_demo_request_collection,
)
from app.features.demo_request.demo_request_service import DemoRequestService


_demo_request_service: DemoRequestService | None = None


def get_demo_request_service() -> DemoRequestService:
    global _demo_request_service
    if _demo_request_service is not None:
        return _demo_request_service

    collection = get_demo_request_collection()
    ensure_demo_request_indexes(collection)
    _demo_request_service = DemoRequestService(collection=collection)
    return _demo_request_service
