from pymongo.collection import Collection


from datetime import datetime, timezone
from typing import Any


class MongoWalletRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    @staticmethod
    def _owner_query(
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any]:
        if user_id:
            return {"user_id": user_id}
        if organization_id:
            return {"organization_id": organization_id}
        raise ValueError("Either user_id or organization_id must be provided")

    def get_wallet(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any] | None:
        return self.collection.find_one(self._owner_query(user_id=user_id, organization_id=organization_id), {"_id": 0})

    def deduct_available(
        self,
        resource_type: str,
        units: int,
        session,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> bool:
        if units <= 0:
            return True
        available_field = "available_messages" if resource_type == "MESSAGE" else "available_sessions"
        result = self.collection.update_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                available_field: {"$gte": units},
            },
            {
                "$inc": {
                    available_field: -units,
                },
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
            session=session,
        )
        return result.modified_count == 1

    def add_wallet_credit(
        self,
        resource_type: str,
        units: int,
        session,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> bool:
        if units <= 0:
            return True
        available_field = "available_messages" if resource_type == "MESSAGE" else "available_sessions"
        result = self.collection.update_one(
            self._owner_query(user_id=user_id, organization_id=organization_id),
            {
                "$inc": {
                    available_field: units,
                },
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
            session=session,
        )
        return result.modified_count == 1

    def ensure_wallet(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(timezone.utc)
        owner_query = self._owner_query(user_id=user_id, organization_id=organization_id)
        self.collection.update_one(
            owner_query,
            {
                "$setOnInsert": {
                    "user_id": user_id,
                    "organization_id": organization_id,
                    "available_messages": 0,
                    "available_sessions": 0,
                    "updated_at": now,
                },
            },
            upsert=True,
        )
        wallet = self.get_wallet(user_id=user_id, organization_id=organization_id)
        if not wallet:
            raise ValueError("Failed to ensure wallet")
        return wallet