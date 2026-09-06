from fastapi import APIRouter, Query

from app.core.response_model import ApiResponse
from app.identity import get_organization_service, get_user_service
from app.identity.domain.errors import IdentityError
from app.identity.models import (
    CreateUserRequest,
    UsersPageView,
    OrganizationView,
    UpdateUserRequest,
    UserView,
)
from app.routers.identity_common import to_http_error


router = APIRouter(prefix="/api/v1", tags=["users"])


@router.post("/users", response_model=ApiResponse[UserView], status_code=201)
def create_user(payload: CreateUserRequest) -> ApiResponse[UserView]:
    try:
        user = get_user_service().create_user(payload)
        return ApiResponse.ok(data=user, message="User created")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get("/users", response_model=ApiResponse[UsersPageView])
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[UsersPageView]:
    try:
        return ApiResponse.ok(
            data=get_user_service().list_users(page=page, page_size=page_size)
        )
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get("/users/{user_id}", response_model=ApiResponse[UserView])
def get_user(user_id: str) -> ApiResponse[UserView]:
    try:
        return ApiResponse.ok(data=get_user_service().get_user(user_id))
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.patch("/users/{user_id}", response_model=ApiResponse[UserView])
def update_user(user_id: str, payload: UpdateUserRequest) -> ApiResponse[UserView]:
    try:
        user = get_user_service().update_user(user_id, payload)
        return ApiResponse.ok(data=user, message="User updated")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.delete("/users/{user_id}", response_model=ApiResponse[None])
def delete_user(user_id: str) -> ApiResponse[None]:
    try:
        get_user_service().delete_user(user_id)
        return ApiResponse.ok(message="User deleted")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get(
    "/users/{user_id}/organizations",
    response_model=ApiResponse[list[OrganizationView]],
)
def list_user_organizations(user_id: str) -> ApiResponse[list[OrganizationView]]:
    try:
        return ApiResponse.ok(
            data=get_organization_service().list_user_organizations(user_id)
        )
    except IdentityError as exc:
        raise to_http_error(exc) from exc
