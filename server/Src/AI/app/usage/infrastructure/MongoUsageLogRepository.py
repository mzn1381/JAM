from pymongo.collection import Collection


from datetime import datetime, timezone
from typing import Any


class MongoUsageLogRepository:
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
    def _apply_usage_log_defaults(doc: dict[str, Any] | None) -> dict[str, Any] | None:
        if not doc:
            return doc
        defaults = {
            "endpoint": "",
            "trace_id": None,
            "committed_units": 0,
            "duration_ms": 0,
            "error_code": None,
            "error_message": doc.get("error_detail"),
        }
        normalized = defaults.copy()
        normalized.update(doc)
        if normalized.get("error_message") is None:
            normalized["error_message"] = normalized.get("error_detail")
        return normalized

    def find_request_by_idempotency(
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
        return self._apply_usage_log_defaults(doc)

    def find_request_by_id(
        self,
        usage_log_id: str,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, Any] | None:
        doc = self.collection.find_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                "id": usage_log_id,
            },
            {"_id": 0},
        )
        return self._apply_usage_log_defaults(doc)

    def insert_received_request(self, doc: dict[str, Any], session) -> None:
        self.collection.insert_one(doc, session=session)

    def insert_failed_request(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def insert_succeeded_request(self, doc: dict[str, Any]) -> None:
        self.collection.insert_one(doc)

    def update_request_to_succeeded(
        self,
        usage_log_id: str,
        committed_units: int,
        duration_ms: int,
        session,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> bool:
        result = self.collection.update_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                "id": usage_log_id,
                "status": "RECEIVED",
            },
            {
                "$set": {
                    "status": "SUCCEEDED",
                    "committed_units": committed_units,
                    "duration_ms": duration_ms,
                    "completed_at": datetime.now(timezone.utc),
                }
            },
            session=session,
        )
        return result.modified_count == 1

    def update_request_to_failed(
        self,
        usage_log_id: str,
        error_code: str | None,
        error_message: str | None,
        duration_ms: int,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> bool:
        result = self.collection.update_one(
            {
                **self._owner_query(user_id=user_id, organization_id=organization_id),
                "id": usage_log_id,
                "status": "RECEIVED",
            },
            {
                "$set": {
                    "status": "FAILED",
                    "error_code": error_code,
                    "error_message": error_message,
                    "duration_ms": duration_ms,
                    "completed_at": datetime.now(timezone.utc),
                }
            },
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
        ).sort("received_at", -1).skip(skip).limit(limit)
        return list(cursor)

    def count(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        return self.collection.count_documents(self._owner_query(user_id=user_id, organization_id=organization_id))

    def count_in_window(
        self,
        *,
        start: datetime,
        end: datetime,
        status: str | None = None,
        endpoint: str | None = None,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> int:
        query: dict[str, Any] = {
            **self._owner_query(user_id=user_id, organization_id=organization_id),
            "received_at": {"$gte": start, "$lt": end},
        }
        if status:
            query["status"] = status
        if endpoint:
            query["endpoint"] = endpoint
        return self.collection.count_documents(query)

    def aggregate_usage_summary(
        self,
        *,
        start: datetime,
        end: datetime,
        user_id: str | None = None,
        organization_id: str | None = None,
        status: str = "SUCCEEDED",
    ) -> dict[str, int]:
        match: dict[str, Any] = {
            **self._owner_query(user_id=user_id, organization_id=organization_id),
            "status": status,
            "received_at": {"$gte": start, "$lt": end},
        }
        pipeline = [
            {"$match": match},
            {
                "$group": {
                    "_id": None,
                    "count": {"$sum": 1},
                }
            },
        ]
        cursor = self.collection.aggregate(pipeline)
        for doc in cursor:
            return {"count": int(doc.get("count", 0))}
        return {"count": 0}

    def aggregate_daily_usage(
        self,
        *,
        start: datetime,
        end: datetime,
        user_id: str | None = None,
        organization_id: str | None = None,
        status: str = "SUCCEEDED",
        timezone_offset: str = "+00:00",
    ) -> list[dict[str, Any]]:
        match: dict[str, Any] = {
            **self._owner_query(user_id=user_id, organization_id=organization_id),
            "status": status,
            "received_at": {"$gte": start, "$lt": end},
        }
        pipeline = [
            {"$match": match},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$received_at",
                            "timezone": timezone_offset,
                        }
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        return list(self.collection.aggregate(pipeline))