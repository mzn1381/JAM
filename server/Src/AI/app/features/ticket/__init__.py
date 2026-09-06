from app.features.ticket.ticket_infrastructure import (
    ensure_ticket_indexes,
    get_ticket_collection,
)
from app.features.ticket.ticket_service import TicketService


_ticket_service: TicketService | None = None


def get_ticket_service() -> TicketService:
    global _ticket_service
    if _ticket_service is not None:
        return _ticket_service

    collection = get_ticket_collection()
    ensure_ticket_indexes(collection)
    _ticket_service = TicketService(collection=collection)
    return _ticket_service
