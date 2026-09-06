import hashlib
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo.database import Database

from app.identity.jwt import JwtTokenService, JwtTokenValidationError
from app.usage.domain.errors import InvalidUsageStateError, UsageNotFoundError
from app.usage.infrastructure.MongoOrganizationApiKeyRepository import (
    MongoOrganizationApiKeyRepository,
)
from app.usage.models import (
    CreateOrganizationApiKeyRequest,
    CreateOrganizationApiKeyResponse,
    OrganizationApiKeyView,
    OrganizationApiKeysPageView,
    UsageTokenOwner,
)


class OrganizationApiKeyService:
    def __init__(
        self,
        db: Database,
        collection_names: dict[str, str],
        jwt_secret: str,
        api_key_ttl_seconds: int,
    ):
        self.db = db
        self.collection_names = collection_names
        self.api_key_ttl_seconds = api_key_ttl_seconds
        self.jwt_tokens = JwtTokenService(
            secret=jwt_secret,
            ttl_seconds=api_key_ttl_seconds,
        )

        self.api_key_repo = MongoOrganizationApiKeyRepository(
            db[collection_names["organization_api_keys"]]
        )

    @staticmethod
    def _token_hash(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    @staticmethod
    def _to_view(doc: dict[str, Any]) -> OrganizationApiKeyView:
        return OrganizationApiKeyView(
            id=doc["id"],
            organization_id=doc["organization_id"],
            name=doc.get("name"),
            created_at=doc["created_at"],
            expires_at=doc["expires_at"],
            revoked_at=doc.get("revoked_at"),
            last_used_at=doc.get("last_used_at"),
        )

    def create_api_key(
        self, organization_id: str, request: CreateOrganizationApiKeyRequest
    ) -> CreateOrganizationApiKeyResponse:
        if not organization_id:
            raise InvalidUsageStateError("organization_id is required")

        key_id = str(uuid4())
        now = datetime.now(timezone.utc)
        token, expires_at = self.jwt_tokens.create_organization_api_key(
            organization_id=organization_id,
            key_id=key_id,
            now=now,
            ttl_seconds=self.api_key_ttl_seconds,
        )
        doc = {
            "id": key_id,
            "organization_id": organization_id,
            "name": request.name,
            "token_hash": self._token_hash(token),
            "created_at": now,
            "expires_at": expires_at,
            "revoked_at": None,
            "last_used_at": None,
        }
        self.api_key_repo.insert(doc)
        return CreateOrganizationApiKeyResponse(
            api_key=token,
            key=self._to_view(doc),
        )

    def list_api_keys(
        self,
        *,
        organization_id: str,
        page: int,
        page_size: int,
    ) -> OrganizationApiKeysPageView:
        if not organization_id:
            raise InvalidUsageStateError("organization_id is required")

        skip = (page - 1) * page_size
        docs = self.api_key_repo.list_paginated(
            organization_id=organization_id,
            skip=skip,
            limit=page_size,
        )
        total = self.api_key_repo.count(organization_id)
        return OrganizationApiKeysPageView(
            items=[self._to_view(doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )

    def remove_api_key(self, *, organization_id: str, key_id: str) -> None:
        if not organization_id or not key_id:
            raise InvalidUsageStateError("organization_id and key_id are required")
        if not self.api_key_repo.delete(organization_id=organization_id, key_id=key_id):
            raise UsageNotFoundError(f"API key '{key_id}' not found")

    def resolve_token_owner(self, token: str) -> str:
        try:
            organization_id, key_id, _ = self.jwt_tokens.resolve_organization_api_key(token)
        except JwtTokenValidationError as exc:
            raise UsageNotFoundError("Invalid or expired organization API key") from exc

        now = datetime.now(timezone.utc)
        doc = self.api_key_repo.find_active(
            key_id=key_id,
            token_hash=self._token_hash(token),
            now=now,
        )
        if not doc:
            raise UsageNotFoundError("Invalid or expired organization API key")

        self.api_key_repo.mark_used(key_id)
        return organization_id
