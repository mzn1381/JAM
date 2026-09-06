from pymongo.collection import Collection


from datetime import datetime, timezone
from typing import Any


class MongoPaymentInfoRepository:
    def __init__(self, collection: Collection):
        self.collection = collection

    @staticmethod
    def _owner_query(
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any]:
        query: dict[str, Any] = {}
        if user_id:
            query["user_id"] = user_id
        if organization_id:
            query["organization_id"] = organization_id
        return query

    @staticmethod
    def _apply_payment_defaults(doc: dict[str, Any] | None) -> dict[str, Any] | None:
        if not doc:
            return doc
        normalized = {
            "metadata": {},
            "completed_at": None,
        }
        normalized.update(doc)
        return normalized

    def find_by_idempotency(
        self,
        idempotency_key: str,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any] | None:
        doc = self.collection.find_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                "idempotency_key": idempotency_key,
            },
            {"_id": 0},
        )
        return self._apply_payment_defaults(doc)

    def insert_payment(self, doc: dict[str, Any], session) -> None:
        self.collection.insert_one(doc, session=session)

    def mark_payment_succeeded(
        self,
        payment_id: str,
        session,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> bool:
        result = self.collection.update_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                "id": payment_id,
                "status": "PENDING",
            },
            {
                "$set": {
                    "status": "SUCCEEDED",
                    "completed_at": datetime.now(timezone.utc),
                }
            },
            session=session,
        )
        return result.modified_count == 1

    def list_paginated(
        self,
        *,
        skip: int,
        limit: int,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> list[dict[str, Any]]:
        cursor = self.collection.find(
            self._owner_query(user_id=user_id, organization_id=organization_id),
            {"_id": 0},
        ).sort("created_at", -1).skip(skip).limit(limit)
        return list(cursor)

    def count(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        return self.collection.count_documents(
            self._owner_query(user_id=user_id, organization_id=organization_id)
        )

    def sum_purchased_units(
        self,
        *,
        resource_type: str,
        status: str,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        pipeline = [
            {
                "$match": {
                    **self._owner_query(
                        user_id=user_id,
                        organization_id=organization_id,
                    ),
                    "resource_type": resource_type,
                    "status": status,
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$purchased_units"},
                }
            },
        ]
        result = list(self.collection.aggregate(pipeline))
        if not result:
            return 0
        return int(result[0].get("total", 0))
