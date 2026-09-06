from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.identity.domain.enums import UserStatus
from app.identity.domain.errors import (
    UserAlreadyExistsError,
    UserNotFoundError,
)
from app.identity.infrastructure.MongoMembershipRepository import (
    MongoMembershipRepository,
)
from app.identity.models import (
    CreateUserRequest,
    UpdateUserRequest,
    UserView,
    UsersPageView,
)
from app.identity.services.password import hash_password, new_salt
from app.identity.infrastructure.MongoUserRepository import MongoUserRepository


class UserService:
    def __init__(self, db: Database, collection_names: dict[str, str]):
        self.db = db
        self.collection_names = collection_names

        self.user_repo = MongoUserRepository(db[collection_names["users"]])
        self.membership_repo = MongoMembershipRepository(db[collection_names["memberships"]])
        self.wallets = db[collection_names["wallets"]]

    @staticmethod
    def _to_view(doc: dict[str, Any]) -> UserView:
        return UserView(
            id=doc["id"],
            email=doc["email"],
            phone_number=doc.get("phone_number"),
            full_name=doc.get("full_name"),
            status=UserStatus(doc.get("status", UserStatus.ACTIVE.value)),
            metadata=doc.get("metadata", {}) or {},
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    def create_user(self, request: CreateUserRequest) -> UserView:
        email = request.email.lower()
        phone_number = request.phone_number.strip() if request.phone_number else None
        if self.user_repo.find_by_email(email):
            raise UserAlreadyExistsError(f"User with email '{email}' already exists")
        if phone_number and self.user_repo.find_by_phone_number(phone_number):
            raise UserAlreadyExistsError(
                f"User with phone number '{phone_number}' already exists"
            )

        user_id = str(uuid4())
        now = datetime.now(timezone.utc)
        salt = new_salt()
        password_hash = hash_password(request.password, salt)

        doc = {
            "id": user_id,
            "email": email,
            "phone_number": phone_number,
            "full_name": request.full_name,
            "password_hash": password_hash,
            "password_salt": salt,
            "status": UserStatus.ACTIVE.value,
            "metadata": request.metadata,
            "created_at": now,
            "updated_at": now,
        }

        try:
            self.user_repo.insert(doc)
        except DuplicateKeyError as exc:
            raise UserAlreadyExistsError(
                "User with this email or phone number already exists"
            ) from exc

        self.wallets.insert_one(
            {
                "user_id": user_id,
                "organization_id": None,
                "available_messages": 0,
                "available_sessions": 0,
                "updated_at": now,
            }
        )

        return self._to_view(doc)

    def get_user(self, user_id: str) -> UserView:
        doc = self.user_repo.find_by_id(user_id)
        if not doc:
            raise UserNotFoundError(f"User '{user_id}' not found")
        return self._to_view(doc)

    def update_user(self, user_id: str, request: UpdateUserRequest) -> UserView:
        existing = self.user_repo.find_by_id(user_id)
        if not existing:
            raise UserNotFoundError(f"User '{user_id}' not found")

        updates: dict[str, Any] = {}
        if request.full_name is not None:
            updates["full_name"] = request.full_name
        if request.status is not None:
            updates["status"] = request.status.value
        if request.metadata is not None:
            updates["metadata"] = request.metadata
        if request.password is not None:
            salt = new_salt()
            updates["password_salt"] = salt
            updates["password_hash"] = hash_password(request.password, salt)

        if updates:
            self.user_repo.update(user_id, updates)

        refreshed = self.user_repo.find_by_id(user_id)
        assert refreshed is not None
        return self._to_view(refreshed)

    def delete_user(self, user_id: str) -> None:
        if not self.user_repo.find_by_id(user_id):
            raise UserNotFoundError(f"User '{user_id}' not found")

        self.membership_repo.delete_by_user(user_id)
        self.user_repo.delete(user_id)

    def list_users(self, *, page: int, page_size: int) -> UsersPageView:
        skip = (page - 1) * page_size
        docs = self.user_repo.list_paginated(skip=skip, limit=page_size)
        total = self.user_repo.count()
        return UsersPageView(
            items=[self._to_view(doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
