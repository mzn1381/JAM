from datetime import datetime, timezone
from uuid import uuid4

from pymongo.database import Database

from app.identity.domain.enums import UserStatus
from app.identity.domain.errors import (
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.identity.jwt import JwtTokenService, JwtTokenValidationError
from app.identity.models import (
    GuestSessionResponse,
    IdentityTokenResolution,
    LoginRequest,
    LoginResponse,
    UserView,
)
from app.identity.services.password import verify_password
from app.identity.services.user_service import UserService
from app.identity.infrastructure.MongoUserRepository import MongoUserRepository


class AuthService:
    def __init__(self, db: Database, collection_names: dict[str, str], token_ttl_seconds: int, jwt_secret: str):
        self.db = db
        self.collection_names = collection_names
        self.jwt_tokens = JwtTokenService(secret=jwt_secret, ttl_seconds=token_ttl_seconds)

        self.user_repo = MongoUserRepository(db[collection_names["users"]])

    def login(self, request: LoginRequest) -> LoginResponse:
        # username is generall, for now it's phonenumber
        phone_number = request.user_name.strip()

        user_doc = self.user_repo.find_by_phone_number(phone_number)
        if not user_doc:
            raise InvalidCredentialsError("Invalid phone number or password")

        if user_doc.get("status") != UserStatus.ACTIVE.value:
            raise InvalidCredentialsError("User account is disabled")

        if not verify_password(request.password, user_doc["password_salt"], user_doc["password_hash"]):
            raise InvalidCredentialsError("Invalid phone number or password")

        token, expires_at = self.jwt_tokens.create_access_token(user_doc["id"])

        return LoginResponse(
            access_token=token,
            token_type="Bearer",
            expires_at=expires_at,
            user=UserService._to_view(user_doc),
        )

    def logout(self, token: str) -> None:
        return None

    def create_guest_session(self) -> GuestSessionResponse:
        guest_user_id = f"guest:{uuid4()}"
        token, expires_at = self.jwt_tokens.create_guest_access_token(
            guest_user_id=guest_user_id,
            now=datetime.now(timezone.utc),
        )
        return GuestSessionResponse(
            access_token=token,
            token_type="Bearer",
            expires_at=expires_at,
            guest_user_id=guest_user_id,
        )

    def resolve_token(self, token: str) -> UserView:
        try:
            user_id = self.jwt_tokens.resolve_user_id(token)
        except JwtTokenValidationError as exc:
            raise InvalidTokenError("Invalid or expired token") from exc

        user_doc = self.user_repo.find_by_id(user_id)
        if not user_doc or user_doc.get("status") != UserStatus.ACTIVE.value:
            raise InvalidTokenError("Invalid or expired token")

        return UserService._to_view(user_doc)

    def resolve_guest_user_id(self, token: str) -> str:
        try:
            return self.jwt_tokens.resolve_guest_user_id(token)
        except JwtTokenValidationError as exc:
            raise InvalidTokenError("Invalid or expired token") from exc

    def resolve_identity_token(self, token: str) -> IdentityTokenResolution:
        try:
            subject = self.jwt_tokens.resolve_identity_subject(token)
        except JwtTokenValidationError as exc:
            raise InvalidTokenError("Invalid or expired token") from exc

        if subject.token_type == "guest_access":
            return IdentityTokenResolution(
                user=self._to_guest_view(subject.subject),
                is_guest=True,
            )

        user_doc = self.user_repo.find_by_id(subject.subject)
        if not user_doc or user_doc.get("status") != UserStatus.ACTIVE.value:
            raise InvalidTokenError("Invalid or expired token")

        return IdentityTokenResolution(
            user=UserService._to_view(user_doc),
            is_guest=False,
        )

    @staticmethod
    def _to_guest_view(guest_user_id: str) -> UserView:
        now = datetime.now(timezone.utc)
        return UserView(
            id=guest_user_id,
            phone_number=guest_user_id,
            email=None,
            full_name=None,
            status=UserStatus.GUEST,
            metadata={},
            created_at=now,
            updated_at=now,
        )
