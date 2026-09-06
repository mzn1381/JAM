from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.response_model import ApiResponse
from app.features.demo_request import get_demo_request_service
from app.features.demo_request.demo_request_errors import DemoRequestError
from app.features.demo_request.demo_request_models import (
    CreateDemoRequestRequest,
    DemoRequestsPageView,
    DemoRequestView,
)
from app.identity.models import UserView
from app.routers.identity_common import current_user


router = APIRouter(prefix="/api/v1", tags=["demo-requests"])


def _to_http_error(exc: DemoRequestError) -> HTTPException:
    code_map = {
        "DEMO_REQUEST_ALREADY_EXISTS": 409,
        "CONFIGURATION_ERROR": 500,
    }
    status = code_map.get(getattr(exc, "code", "DEMO_REQUEST_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


@router.post(
    "/demo-requests",
    response_model=ApiResponse[DemoRequestView],
    status_code=201,
)
def create_demo_request(
    payload: CreateDemoRequestRequest,
) -> ApiResponse[DemoRequestView]:
    try:
        demo_request = get_demo_request_service().create_demo_request(payload)
        return ApiResponse.ok(data=demo_request, message="Demo request submitted")
    except DemoRequestError as exc:
        raise _to_http_error(exc) from exc


@router.get(
    "/admin/demo-requests",
    response_model=ApiResponse[DemoRequestsPageView],
)
def list_demo_requests(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    # _: UserView = Depends(current_user),
) -> ApiResponse[DemoRequestsPageView]:
    try:
        return ApiResponse.ok(
            data=get_demo_request_service().list_demo_requests(
                page=page,
                page_size=page_size,
            )
        )
    except DemoRequestError as exc:
        raise _to_http_error(exc) from exc
