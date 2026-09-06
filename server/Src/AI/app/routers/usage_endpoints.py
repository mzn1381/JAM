from fastapi import APIRouter, HTTPException, Query

from app.core.response_model import ApiResponse
from app.usage import get_dashboard_usage_service, get_payment_service, get_usage_service
from app.usage.domain.errors import UsageError
from app.usage.models import (
    CreditAccountRequest,
    CreditAccountResponse,
    PaymentInfoPageView,
    UsageAuthorizeRequest,
    UsageCheckResponse,
    UsageDashboardView,
    UsageLogsPageView,
    UsageFinalizeRequest,
    UsageFinalizeResponse,
    WalletView,
)

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])

def _to_http_error(exc: UsageError) -> HTTPException:
    code_map = {
        "INSUFFICIENT_CREDITS": 402,
        "USAGE_NOT_FOUND": 404,
        "INVALID_USAGE_STATE": 409,
        "CONFIGURATION_ERROR": 500,
    }
    status = code_map.get(getattr(exc, "code", "USAGE_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


@router.get("/wallet", response_model=ApiResponse[WalletView])
def get_wallet(
    user_id: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
) -> ApiResponse[WalletView]:
    try:
        return ApiResponse.ok(
            data=get_usage_service().get_wallet(
                user_id=user_id,
                organization_id=organization_id,
            )
        )
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.get("/usage-logs", response_model=ApiResponse[UsageLogsPageView])
def list_usage_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
) -> ApiResponse[UsageLogsPageView]:
    try:
        return ApiResponse.ok(
            data=get_usage_service().list_usage_logs(
                page=page,
                page_size=page_size,
                user_id=user_id,
                organization_id=organization_id,
            )
        )
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.get("/payments", response_model=ApiResponse[PaymentInfoPageView])
def list_payments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user_id: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
) -> ApiResponse[PaymentInfoPageView]:
    try:
        return ApiResponse.ok(
            data=get_payment_service().list_payments(
                page=page,
                page_size=page_size,
                user_id=user_id,
                organization_id=organization_id,
            )
        )
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.post("/payments", response_model=ApiResponse[CreditAccountResponse], status_code=201)
def create_payment(payload: CreditAccountRequest) -> ApiResponse[CreditAccountResponse]:
    try:
        payment = get_payment_service().credit_account(payload)
        return ApiResponse.ok(data=payment, message="Payment processed")
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.get("/dashboard", response_model=ApiResponse[UsageDashboardView])
def get_usage_dashboard(
    user_id: str | None = Query(default=None),
    organization_id: str | None = Query(default=None),
) -> ApiResponse[UsageDashboardView]:
    try:
        return ApiResponse.ok(
            data=get_dashboard_usage_service().get_dashboard(
                user_id=user_id,
                organization_id=organization_id,
            )
        )
    except UsageError as exc:
        raise _to_http_error(exc) from exc

