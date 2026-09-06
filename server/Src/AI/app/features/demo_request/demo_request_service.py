from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError

from app.features.demo_request.demo_request_errors import DemoRequestAlreadyExistsError
from app.features.demo_request.demo_request_models import (
    CreateDemoRequestRequest,
    DemoRequestsPageView,
    DemoRequestView,
)
from app.features.demo_request.demo_request_repository import MongoDemoRequestRepository


class DemoRequestService:
    def __init__(self, collection: Collection):
        self.repository = MongoDemoRequestRepository(collection)

    @staticmethod
    def _to_view(doc: dict[str, Any]) -> DemoRequestView:
        return DemoRequestView(
            id=doc["id"],
            full_name=doc["full_name"],
            company_name=doc["company_name"],
            company_size=doc["company_size"],
            job_title=doc["job_title"],
            phone_number=doc["phone_number"],
            metadata=doc.get("metadata", {}) or {},
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    def create_demo_request(self, request: CreateDemoRequestRequest) -> DemoRequestView:
        phone_number = request.phone_number.strip()
        if self.repository.find_by_phone_number(phone_number):
            raise DemoRequestAlreadyExistsError(
                "Demo request with this phone number already exists"
            )

        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid4()),
            "full_name": request.full_name,
            "company_name": request.company_name,
            "company_size": request.company_size.value,
            "job_title": request.job_title,
            "phone_number": phone_number,
            "metadata": request.metadata,
            "created_at": now,
            "updated_at": now,
        }

        try:
            self.repository.insert(doc)
        except DuplicateKeyError as exc:
            raise DemoRequestAlreadyExistsError(
                "Demo request with this phone number already exists"
            ) from exc

        return self._to_view(doc)

    def list_demo_requests(self, *, page: int, page_size: int) -> DemoRequestsPageView:
        skip = (page - 1) * page_size
        docs = self.repository.list_paginated(skip=skip, limit=page_size)
        total = self.repository.count()
        return DemoRequestsPageView(
            items=[self._to_view(doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
