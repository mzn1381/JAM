class TicketError(Exception):
    code = "TICKET_ERROR"


class TicketConfigurationError(TicketError):
    code = "CONFIGURATION_ERROR"
