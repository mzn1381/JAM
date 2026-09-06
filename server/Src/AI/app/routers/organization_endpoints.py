from fastapi import APIRouter, Query

from app.core.response_model import ApiResponse
from app.identity import get_organization_service
from app.identity.domain.errors import IdentityError
from app.identity.models import (
    AddMemberRequest,
    CreateOrganizationRequest,
    MembershipView,
    OrganizationsPageView,
    OrganizationView,
    UpdateMemberRoleRequest,
    UpdateOrganizationRequest,
    UserView,
)
from app.routers.identity_common import to_http_error


router = APIRouter(prefix="/api/v1", tags=["organizations"])


@router.post("/organizations", response_model=ApiResponse[OrganizationView], status_code=201)
def create_organization(payload: CreateOrganizationRequest) -> ApiResponse[OrganizationView]:
    try:
        org = get_organization_service().create_organization(payload)
        return ApiResponse.ok(data=org, message="Organization created")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get("/organizations", response_model=ApiResponse[OrganizationsPageView])
def list_organizations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[OrganizationsPageView]:
    try:
        return ApiResponse.ok(
            data=get_organization_service().list_organizations(
                page=page,
                page_size=page_size,
            )
        )
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get("/organizations/{org_id}", response_model=ApiResponse[OrganizationView])
def get_organization(org_id: str) -> ApiResponse[OrganizationView]:
    try:
        return ApiResponse.ok(data=get_organization_service().get_organization(org_id))
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.patch("/organizations/{org_id}", response_model=ApiResponse[OrganizationView])
def update_organization(
    org_id: str, payload: UpdateOrganizationRequest
) -> ApiResponse[OrganizationView]:
    try:
        org = get_organization_service().update_organization(org_id, payload)
        return ApiResponse.ok(data=org, message="Organization updated")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.delete("/organizations/{org_id}", response_model=ApiResponse[None])
def delete_organization(org_id: str) -> ApiResponse[None]:
    try:
        get_organization_service().delete_organization(org_id)
        return ApiResponse.ok(message="Organization deleted")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.post(
    "/organizations/{org_id}/members",
    response_model=ApiResponse[MembershipView],
    status_code=201,
)
def add_organization_member(
    org_id: str, payload: AddMemberRequest
) -> ApiResponse[MembershipView]:
    try:
        membership = get_organization_service().add_member(org_id, payload)
        return ApiResponse.ok(data=membership, message="Member added")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.patch(
    "/organizations/{org_id}/members/{user_id}",
    response_model=ApiResponse[MembershipView],
)
def update_organization_member_role(
    org_id: str, user_id: str, payload: UpdateMemberRoleRequest
) -> ApiResponse[MembershipView]:
    try:
        membership = get_organization_service().update_member_role(org_id, user_id, payload)
        return ApiResponse.ok(data=membership, message="Member role updated")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.delete(
    "/organizations/{org_id}/members/{user_id}",
    response_model=ApiResponse[None],
)
def remove_organization_member(org_id: str, user_id: str) -> ApiResponse[None]:
    try:
        get_organization_service().remove_member(org_id, user_id)
        return ApiResponse.ok(message="Member removed")
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.get(
    "/organizations/{org_id}/members",
    response_model=ApiResponse[list[UserView]],
)
def list_organization_members(org_id: str) -> ApiResponse[list[UserView]]:
    try:
        return ApiResponse.ok(
            data=get_organization_service().list_organization_members(org_id)
        )
    except IdentityError as exc:
        raise to_http_error(exc) from exc
