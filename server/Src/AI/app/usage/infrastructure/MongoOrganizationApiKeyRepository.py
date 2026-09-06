from datetime import datetime, timezone
from typing import Any

from pymongo.collection import Collection


class MongoOrganizationApiKeyRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def find_active(self, key_id: str, token_hash: str, now: datetime) -> dict[str, Any] | None:
        return self.collection.find_one(
            {
                "id": key_id,
                "token_hash": token_hash,
                "revoked_at": None,
                "expires_at": {"$gt": now},
            },
            {"_id": 0},
        )

    def mark_used(self, key_id: str) -> None:
        self.collection.update_one(
            {"id": key_id},
            {"$set": {"last_used_at": datetime.now(timezone.utc)}},
        )

    def list_paginated(self, *, organization_id: str, skip: int, limit: int) -> list[dict[str, Any]]:
        cursor = (
            self.collection.find({"organization_id": organization_id}, {"_id": 0, "token_hash": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return list(cursor)

    def count(self, organization_id: str) -> int:
        return self.collection.count_documents({"organization_id": organization_id})

    def delete(self, *, organization_id: str, key_id: str) -> bool:
        result = self.collection.delete_one(
            {
                "id": key_id,
                "organization_id": organization_id,
            }
        )
        return result.deleted_count == 1
