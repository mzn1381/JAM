from app.identity.infrastructure.MongoMembershipRepository import _now


from pymongo.collection import Collection


from typing import Any


class MongoUserRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find_by_id(self, user_id: str) -> dict[str, Any] | None:
        return self.collection.find_one({"id": user_id}, {"_id": 0})

    def find_by_email(self, email: str) -> dict[str, Any] | None:
        return self.collection.find_one({"email": email.lower()}, {"_id": 0})

    def find_by_phone_number(self, phone_number: str) -> dict[str, Any] | None:
        normalized_phone_number = phone_number.strip()
        return self.collection.find_one(
            {"phone_number": normalized_phone_number},
            {"_id": 0},
        )

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def update(self, user_id: str, updates: dict[str, Any]) -> bool:
        payload = dict(updates)
        payload["updated_at"] = _now()
        result = self.collection.update_one({"id": user_id}, {"$set": payload})
        return result.matched_count == 1

    def delete(self, user_id: str) -> bool:
        result = self.collection.delete_one({"id": user_id})
        return result.deleted_count == 1

    def list_by_ids(self, user_ids: list[str]) -> list[dict[str, Any]]:
        if not user_ids:
            return []
        return list(self.collection.find({"id": {"$in": user_ids}}, {"_id": 0}))

    def list_paginated(self, *, skip: int, limit: int) -> list[dict[str, Any]]:
        cursor = (
            self.collection.find({}, {"_id": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return list(cursor)

    def count(self) -> int:
        return self.collection.count_documents({})
