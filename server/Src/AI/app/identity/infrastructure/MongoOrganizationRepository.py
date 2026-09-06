from app.identity.infrastructure.MongoMembershipRepository import _now


from pymongo.collection import Collection


from typing import Any


class MongoOrganizationRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find_by_id(self, org_id: str) -> dict[str, Any] | None:
        return self.collection.find_one({"id": org_id}, {"_id": 0})

    def find_by_slug(self, slug: str) -> dict[str, Any] | None:
        return self.collection.find_one({"slug": slug.lower()}, {"_id": 0})

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def update(self, org_id: str, updates: dict[str, Any]) -> bool:
        payload = dict(updates)
        payload["updated_at"] = _now()
        result = self.collection.update_one({"id": org_id}, {"$set": payload})
        return result.matched_count == 1

    def delete(self, org_id: str) -> bool:
        result = self.collection.delete_one({"id": org_id})
        return result.deleted_count == 1

    def list_by_ids(self, org_ids: list[str]) -> list[dict[str, Any]]:
        if not org_ids:
            return []
        return list(self.collection.find({"id": {"$in": org_ids}}, {"_id": 0}))

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