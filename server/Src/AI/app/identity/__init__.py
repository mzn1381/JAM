from app.identity.infrastructure.mongo import (
    get_collections,
    get_identity_db,
)
from app.identity.infrastructure.mongo import ensure_identity_indexes
from app.identity.services.auth_service import AuthService
from app.identity.services.organization_service import OrganizationService
from app.identity.services.user_service import UserService


_user_service: UserService | None = None
_organization_service: OrganizationService | None = None
_auth_service: AuthService | None = None


def _bootstrap():
    db, settings = get_identity_db()
    collection_names = get_collections(db, settings)
    ensure_identity_indexes(db, collection_names)
    return db, collection_names, settings


def get_user_service() -> UserService:
    global _user_service
    if _user_service is not None:
        return _user_service

    db, collection_names, _ = _bootstrap()
    _user_service = UserService(db=db, collection_names=collection_names)
    return _user_service


def get_organization_service() -> OrganizationService:
    global _organization_service
    if _organization_service is not None:
        return _organization_service

    db, collection_names, _ = _bootstrap()
    _organization_service = OrganizationService(db=db, collection_names=collection_names)
    return _organization_service


def get_auth_service() -> AuthService:
    global _auth_service
    if _auth_service is not None:
        return _auth_service

    db, collection_names, settings = _bootstrap()
    _auth_service = AuthService(
        db=db,
        collection_names=collection_names,
        token_ttl_seconds=settings.token_ttl_seconds,
        jwt_secret=settings.jwt_secret,
    )
    return _auth_service
