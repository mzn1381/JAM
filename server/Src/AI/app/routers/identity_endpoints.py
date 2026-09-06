from fastapi import APIRouter, Depends

from app.core.response_model import ApiResponse
from app.identity import (
    get_auth_service,
    get_organization_service,
)
from app.usage import get_usage_service
from app.identity.domain.errors import IdentityError
from app.identity.models import (
    GuestSessionResponse,
    LoginRequest,
    LoginResponse,
    MeResponse,
    MembershipView,
)
from app.routers.identity_common import require_bearer_token, to_http_error


router = APIRouter(prefix="/api/v1/identity", tags=["identity"])


# ---------- Auth ----------


@router.post("/login", response_model=ApiResponse[LoginResponse])
def login(payload: LoginRequest) -> ApiResponse[LoginResponse]:
    try:
        return ApiResponse.ok(
            data=get_auth_service().login(payload),
            message="Login successful",
        )
    except IdentityError as exc:
        raise to_http_error(exc) from exc


@router.post("/logout", response_model=ApiResponse[None])
def logout(token: str = Depends(require_bearer_token)) -> ApiResponse[None]:
    get_auth_service().logout(token)
    return ApiResponse.ok(message="Logout successful")


@router.post("/guest-session", response_model=ApiResponse[GuestSessionResponse])
def create_guest_session() -> ApiResponse[GuestSessionResponse]:
    session = get_auth_service().create_guest_session()
    get_usage_service().ensure_wallet(user_id=session.guest_user_id)
    return ApiResponse.ok(
        data=session,
        message="Guest session created",
    )


@router.get("/identity_user_info", response_model=ApiResponse[MeResponse])
def identity_user_info(
    token: str = Depends(require_bearer_token),
) -> ApiResponse[MeResponse]:
    try:
        identity = get_auth_service().resolve_identity_token(token)
    except IdentityError as exc:
        raise to_http_error(exc) from exc

    if identity.is_guest:
        return ApiResponse.ok(
            data=MeResponse(
                user=identity.user,
                organizations=[],
                memberships=[],
            )
        )

    org_service = get_organization_service()
    user = identity.user
    organizations = org_service.list_user_organizations(user.id)
    memberships_docs = org_service.membership_repo.list_by_user(user.id)
    memberships = [
        MembershipView(
            organization_id=doc["organization_id"],
            user_id=doc["user_id"],
            role=doc["role"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )
        for doc in memberships_docs
    ]
    return ApiResponse.ok(
        data=MeResponse(user=user, organizations=organizations, memberships=memberships)
    )
