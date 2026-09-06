from datetime import datetime, timezone
from typing import Any

from pymongo.collection import Collection


def _now() -> datetime:
    return datetime.now(timezone.utc)


class MongoMembershipRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find(self, organization_id: str, user_id: str) -> dict[str, Any] | None:
        return self.collection.find_one(
            {"organization_id": organization_id, "user_id": user_id},
            {"_id": 0},
        )

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def update_role(self, organization_id: str, user_id: str, role: str) -> bool:
        result = self.collection.update_one(
            {"organization_id": organization_id, "user_id": user_id},
            {"$set": {"role": role, "updated_at": _now()}},
        )
        return result.matched_count == 1

    def delete(self, organization_id: str, user_id: str) -> bool:
        result = self.collection.delete_one(
            {"organization_id": organization_id, "user_id": user_id},
        )
        return result.deleted_count == 1

    def list_by_organization(self, organization_id: str) -> list[dict[str, Any]]:
        return list(self.collection.find({"organization_id": organization_id}, {"_id": 0}))

    def list_by_user(self, user_id: str) -> list[dict[str, Any]]:
        return list(self.collection.find({"user_id": user_id}, {"_id": 0}))

    def delete_by_organization(self, organization_id: str) -> int:
        result = self.collection.delete_many({"organization_id": organization_id})
        return result.deleted_count

    def delete_by_user(self, user_id: str) -> int:
        result = self.collection.delete_many({"user_id": user_id})
        return result.deleted_count


