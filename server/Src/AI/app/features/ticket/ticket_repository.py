from typing import Any

from pymongo.collection import Collection


class MongoTicketRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

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
