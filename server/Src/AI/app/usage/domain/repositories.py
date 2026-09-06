from typing import Protocol, Any

from pymongo.client_session import ClientSession


class WalletRepository(Protocol):
    def get_wallet(self, organization_id: str) -> dict[str, Any] | None:
        ...

    def deduct_available(self, organization_id: str, resource_type: str, units: int, session: ClientSession) -> bool:
        ...

    def credit_available(self, organization_id: str, resource_type: str, units: int, session: ClientSession) -> bool:
        ...


class UsageLogRepository(Protocol):
    def find_request_by_idempotency(self, organization_id: str, idempotency_key: str) -> dict[str, Any] | None:
        ...

    def find_request_by_id(self, organization_id: str, usage_log_id: str) -> dict[str, Any] | None:
        ...

    def insert_received_request(self, doc: dict[str, Any], session: ClientSession) -> None:
        ...

    def update_request_to_succeeded(
        self,
        organization_id: str,
        usage_log_id: str,
        committed_units: int,
        duration_ms: int,
        session: ClientSession,
    ) -> bool:
        ...

    def update_request_to_failed(
        self,
        organization_id: str,
        usage_log_id: str,
        error_code: str | None,
        error_message: str | None,
        duration_ms: int,
    ) -> bool:
        ...


class PaymentInfoRepository(Protocol):
    def find_by_idempotency(self, organization_id: str, idempotency_key: str) -> dict[str, Any] | None:
        ...

    def insert_payment(self, doc: dict[str, Any], session: ClientSession) -> None:
        ...

    def mark_succeeded(self, organization_id: str, payment_id: str, session: ClientSession) -> bool:
        ...
