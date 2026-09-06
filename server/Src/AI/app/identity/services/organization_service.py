from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.identity.domain.enums import MembershipRole, OrganizationStatus
from app.identity.domain.errors import (
    MembershipAlreadyExistsError,
    MembershipNotFoundError,
    OrganizationAlreadyExistsError,
    OrganizationNotFoundError,
    UserNotFoundError,
)
from app.identity.infrastructure.MongoMembershipRepository import (
    MongoMembershipRepository,
)
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
from app.identity.infrastructure.MongoOrganizationRepository import MongoOrganizationRepository
from app.identity.infrastructure.MongoUserRepository import MongoUserRepository


class OrganizationService:
    def __init__(self, db: Database, collection_names: dict[str, str]):
        self.db = db
        self.collection_names = collection_names

        self.organization_repo = MongoOrganizationRepository(db[collection_names["organizations"]])
        self.membership_repo = MongoMembershipRepository(db[collection_names["memberships"]])
        self.user_repo = MongoUserRepository(db[collection_names["users"]])
        self.wallets = db[collection_names["wallets"]]

    @staticmethod
    def _to_org_view(doc: dict[str, Any]) -> OrganizationView:
        return OrganizationView(
            id=doc["id"],
            slug=doc["slug"],
            name=doc["name"],
            status=OrganizationStatus(doc.get("status", OrganizationStatus.ACTIVE.value)),
            metadata=doc.get("metadata", {}) or {},
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    @staticmethod
    def _to_membership_view(doc: dict[str, Any]) -> MembershipView:
        return MembershipView(
            organization_id=doc["organization_id"],
            user_id=doc["user_id"],
            role=MembershipRole(doc["role"]),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    @staticmethod
    def _to_user_view(doc: dict[str, Any]) -> UserView:
        from app.identity.services.user_service import UserService

        return UserService._to_view(doc)

    def create_organization(self, request: CreateOrganizationRequest) -> OrganizationView:
        slug = request.slug.lower()
        if self.organization_repo.find_by_slug(slug):
            raise OrganizationAlreadyExistsError(f"Organization with slug '{slug}' already exists")

        if request.owner_user_id and not self.user_repo.find_by_id(request.owner_user_id):
            raise UserNotFoundError(f"User '{request.owner_user_id}' not found")

        org_id = str(uuid4())
        now = datetime.now(timezone.utc)

        doc = {
            "id": org_id,
            "slug": slug,
            "name": request.name,
            "status": OrganizationStatus.ACTIVE.value,
            "metadata": request.metadata,
            "created_at": now,
            "updated_at": now,
        }
        try:
            self.organization_repo.insert(doc)
        except DuplicateKeyError as exc:
            raise OrganizationAlreadyExistsError(f"Organization with slug '{slug}' already exists") from exc

        self.wallets.insert_one(
            {
                "user_id": None,
                "organization_id": org_id,
                "available_messages": 0,
                "available_sessions": 0,
                "updated_at": now,
            }
        )

        if request.owner_user_id:
            self.membership_repo.insert(
                {
                    "organization_id": org_id,
                    "user_id": request.owner_user_id,
                    "role": MembershipRole.OWNER.value,
                    "created_at": now,
                    "updated_at": now,
                }
            )

        return self._to_org_view(doc)

    def get_organization(self, org_id: str) -> OrganizationView:
        doc = self.organization_repo.find_by_id(org_id)
        if not doc:
            raise OrganizationNotFoundError(f"Organization '{org_id}' not found")
        return self._to_org_view(doc)

    def update_organization(self, org_id: str, request: UpdateOrganizationRequest) -> OrganizationView:
        if not self.organization_repo.find_by_id(org_id):
            raise OrganizationNotFoundError(f"Organization '{org_id}' not found")

        updates: dict[str, Any] = {}
        if request.name is not None:
            updates["name"] = request.name
        if request.status is not None:
            updates["status"] = request.status.value
        if request.metadata is not None:
            updates["metadata"] = request.metadata

        if updates:
            self.organization_repo.update(org_id, updates)

        refreshed = self.organization_repo.find_by_id(org_id)
        assert refreshed is not None
        return self._to_org_view(refreshed)

    def delete_organization(self, org_id: str) -> None:
        if not self.organization_repo.find_by_id(org_id):
            raise OrganizationNotFoundError(f"Organization '{org_id}' not found")
        self.membership_repo.delete_by_organization(org_id)
        self.organization_repo.delete(org_id)

    # ---------- Memberships ----------

    def add_member(self, org_id: str, request: AddMemberRequest) -> MembershipView:
        if not self.organization_repo.find_by_id(org_id):
            raise OrganizationNotFoundError(f"Organization '{org_id}' not found")
        if not self.user_repo.find_by_id(request.user_id):
            raise UserNotFoundError(f"User '{request.user_id}' not found")
        if self.membership_repo.find(org_id, request.user_id):
            raise MembershipAlreadyExistsError(
                f"User '{request.user_id}' is already a member of organization '{org_id}'"
            )

        now = datetime.now(timezone.utc)
        doc = {
            "organization_id": org_id,
            "user_id": request.user_id,
            "role": request.role.value,
            "created_at": now,
            "updated_at": now,
        }
        try:
            self.membership_repo.insert(doc)
        except DuplicateKeyError as exc:
            raise MembershipAlreadyExistsError(
                f"User '{request.user_id}' is already a member of organization '{org_id}'"
            ) from exc

        return self._to_membership_view(doc)

    def update_member_role(
        self, org_id: str, user_id: str, request: UpdateMemberRoleRequest
    ) -> MembershipView:
        existing = self.membership_repo.find(org_id, user_id)
        if not existing:
            raise MembershipNotFoundError(
                f"Membership for user '{user_id}' in organization '{org_id}' not found"
            )
        self.membership_repo.update_role(org_id, user_id, request.role.value)
        refreshed = self.membership_repo.find(org_id, user_id)
        assert refreshed is not None
        return self._to_membership_view(refreshed)

    def remove_member(self, org_id: str, user_id: str) -> None:
        if not self.membership_repo.find(org_id, user_id):
            raise MembershipNotFoundError(
                f"Membership for user '{user_id}' in organization '{org_id}' not found"
            )
        self.membership_repo.delete(org_id, user_id)

    def list_organization_members(self, org_id: str) -> list[UserView]:
        if not self.organization_repo.find_by_id(org_id):
            raise OrganizationNotFoundError(f"Organization '{org_id}' not found")
        memberships = self.membership_repo.list_by_organization(org_id)
        if not memberships:
            return []
        user_ids = [m["user_id"] for m in memberships]
        docs = self.user_repo.list_by_ids(user_ids)
        return [self._to_user_view(d) for d in docs]

    def list_user_organizations(self, user_id: str) -> list[OrganizationView]:
        if not self.user_repo.find_by_id(user_id):
            raise UserNotFoundError(f"User '{user_id}' not found")
        memberships = self.membership_repo.list_by_user(user_id)
        if not memberships:
            return []
        org_ids = [m["organization_id"] for m in memberships]
        docs = self.organization_repo.list_by_ids(org_ids)
        return [self._to_org_view(d) for d in docs]

    def list_organizations(self, *, page: int, page_size: int) -> OrganizationsPageView:
        skip = (page - 1) * page_size
        docs = self.organization_repo.list_paginated(skip=skip, limit=page_size)
        total = self.organization_repo.count()
        return OrganizationsPageView(
            items=[self._to_org_view(doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
