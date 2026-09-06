from fastapi import APIRouter, HTTPException, Query

from app.core.response_model import ApiResponse
from app.usage import get_organization_api_key_service
from app.usage.domain.errors import UsageError
from app.usage.models import (
    CreateOrganizationApiKeyRequest,
    CreateOrganizationApiKeyResponse,
    OrganizationApiKeysPageView,
)


router = APIRouter(prefix="/api/v1/usage/organizations", tags=["organization-api-keys"])


def _to_http_error(exc: UsageError) -> HTTPException:
    code_map = {
        "USAGE_NOT_FOUND": 404,
        "INVALID_USAGE_STATE": 409,
        "CONFIGURATION_ERROR": 500,
    }
    status = code_map.get(getattr(exc, "code", "USAGE_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


@router.post(
    "/{organization_id}/api-keys",
    response_model=ApiResponse[CreateOrganizationApiKeyResponse],
    status_code=201,
)
def create_organization_api_key(
    organization_id: str,
    payload: CreateOrganizationApiKeyRequest,
) -> ApiResponse[CreateOrganizationApiKeyResponse]:
    try:
        api_key = get_organization_api_key_service().create_api_key(organization_id, payload)
        return ApiResponse.ok(data=api_key, message="API key created")
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.get(
    "/{organization_id}/api-keys",
    response_model=ApiResponse[OrganizationApiKeysPageView],
)
def list_organization_api_keys(
    organization_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[OrganizationApiKeysPageView]:
    try:
        return ApiResponse.ok(
            data=get_organization_api_key_service().list_api_keys(
                organization_id=organization_id,
                page=page,
                page_size=page_size,
            )
        )
    except UsageError as exc:
        raise _to_http_error(exc) from exc


@router.delete(
    "/{organization_id}/api-keys/{key_id}",
    response_model=ApiResponse[None],
)
def remove_organization_api_key(
    organization_id: str,
    key_id: str,
) -> ApiResponse[None]:
    try:
        get_organization_api_key_service().remove_api_key(
            organization_id=organization_id,
            key_id=key_id,
        )
        return ApiResponse.ok(message="API key removed")
    except UsageError as exc:
        raise _to_http_error(exc) from exc
