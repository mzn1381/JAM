from pymongo.collection import Collection


from typing import Any


class MongoAuthTokenRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    def find_by_token_hash(self, token_hash: str) -> dict[str, Any] | None:
        return self.collection.find_one({"token_hash": token_hash}, {"_id": 0})

    def insert(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def delete(self, token_hash: str) -> bool:
        result = self.collection.delete_one({"token_hash": token_hash})
        return result.deleted_count == 1

    def delete_by_user(self, user_id: str) -> int:
        result = self.collection.delete_many({"user_id": user_id})
        return result.deleted_count