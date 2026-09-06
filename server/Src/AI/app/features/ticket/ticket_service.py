from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from pymongo.collection import Collection

from app.features.ticket.ticket_models import (
    CreateTicketRequest,
    TicketsPageView,
    TicketView,
)
from app.features.ticket.ticket_repository import MongoTicketRepository


class TicketService:
    def __init__(self, collection: Collection):
        self.repository = MongoTicketRepository(collection)

    @staticmethod
    def _to_view(doc: dict[str, Any]) -> TicketView:
        return TicketView(
            id=doc["id"],
            full_name=doc["full_name"],
            subject=doc["subject"],
            email=doc["email"],
            phone_number=doc["phone_number"],
            organization_name=doc.get("organization_name"),
            content_text=doc["content_text"],
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )

    def create_ticket(self, request: CreateTicketRequest) -> TicketView:
        now = datetime.now(timezone.utc)
        doc = {
            "id": str(uuid4()),
            "full_name": request.full_name,
            "subject": request.subject,
            "email": request.email,
            "phone_number": request.phone_number,
            "organization_name": request.organization_name,
            "content_text": request.content_text,
            "created_at": now,
            "updated_at": now,
        }

        self.repository.insert(doc)
        return self._to_view(doc)

    def list_tickets(self, *, page: int, page_size: int) -> TicketsPageView:
        skip = (page - 1) * page_size
        docs = self.repository.list_paginated(skip=skip, limit=page_size)
        total = self.repository.count()
        return TicketsPageView(
            items=[self._to_view(doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
