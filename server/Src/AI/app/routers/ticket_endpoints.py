from fastapi import APIRouter, HTTPException, Query

from app.core.response_model import ApiResponse
from app.features.ticket import get_ticket_service
from app.features.ticket.ticket_errors import TicketError
from app.features.ticket.ticket_models import (
    CreateTicketRequest,
    TicketsPageView,
    TicketView,
)


router = APIRouter(prefix="/api/v1", tags=["tickets"])


def _to_http_error(exc: TicketError) -> HTTPException:
    code_map = {
        "CONFIGURATION_ERROR": 500,
    }
    status = code_map.get(getattr(exc, "code", "TICKET_ERROR"), 400)
    return HTTPException(status_code=status, detail=str(exc))


@router.post(
    "/tickets",
    response_model=ApiResponse[TicketView],
    status_code=201,
)
def create_ticket(payload: CreateTicketRequest) -> ApiResponse[TicketView]:
    try:
        ticket = get_ticket_service().create_ticket(payload)
        return ApiResponse.ok(data=ticket, message="Ticket submitted")
    except TicketError as exc:
        raise _to_http_error(exc) from exc


@router.get(
    "/admin/tickets",
    response_model=ApiResponse[TicketsPageView],
)
def list_tickets(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> ApiResponse[TicketsPageView]:
    try:
        return ApiResponse.ok(
            data=get_ticket_service().list_tickets(
                page=page,
                page_size=page_size,
            )
        )
    except TicketError as exc:
        raise _to_http_error(exc) from exc
