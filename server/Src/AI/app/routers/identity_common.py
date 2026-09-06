from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.identity import get_auth_service
from app.identity.domain.errors import IdentityError
from app.identity.models import UserView


# Declaring an HTTPBearer security scheme makes Swagger UI render the global
# "Authorize" button and automatically inject the "Authorization: Bearer <token>"
# header on every request to endpoints that depend on it.
bearer_scheme = HTTPBearer(auto_error=False, description="Bearer <token>")


def to_http_error(exc: IdentityError) -> HTTPException:
    code_map = {
        "USER_NOT_FOUND": 404,
        "ORGANIZATION_NOT_FOUND": 404,
        "MEMBERSHIP_NOT_FOUND": 404,
        "USER_ALREADY_EXISTS": 409,
        "ORGANIZATION_ALREADY_EXISTS": 409,
        "MEMBERSHIP_ALREADY_EXISTS": 409,
        "INVALID_CREDENTIALS": 401,
        "INVALID_TOKEN": 401,
        "CONFIGURATION_ERROR": 500,
    }
    status = code_map.get(getattr(exc, "code", "IDENTITY_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


def _require_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None or (credentials.scheme or "").lower() != "bearer" or not (credentials.credentials or "").strip():
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )
    return credentials.credentials.strip()


def extract_bearer(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    return parts[1].strip()


def resolve_current_user(authorization: str | None) -> UserView:
    token = extract_bearer(authorization)
    try:
        return get_auth_service().resolve_token(token)
    except IdentityError as exc:
        raise to_http_error(exc) from exc


def require_bearer_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    """Dependency that yields the raw bearer token and registers the security scheme in OpenAPI."""
    return _require_token(credentials)


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserView:
    token = _require_token(credentials)
    try:
        return get_auth_service().resolve_token(token)
    except IdentityError as exc:
        raise to_http_error(exc) from exc
