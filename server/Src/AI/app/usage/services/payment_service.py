from datetime import datetime, timezone
from uuid import uuid4

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.usage.domain.enums import PaymentStatus
from app.usage.domain.errors import ConfigurationError, InvalidUsageStateError
from app.usage.infrastructure.MongoPaymentInfoRepository import MongoPaymentInfoRepository
from app.usage.infrastructure.transaction import run_transaction_with_retry
from app.usage.models import (
    CreditAccountRequest,
    CreditAccountResponse,
    PaymentInfoDocument,
    PaymentInfoPageView,
)
from app.usage.infrastructure.MongoWalletRepository import MongoWalletRepository


class PaymentService:
    def __init__(self, db: Database, collection_names: dict[str, str]):
        self.db = db
        self.collection_names = collection_names

        self.wallet_repo = MongoWalletRepository(db[collection_names["wallets"]])
        self.payment_repo = MongoPaymentInfoRepository(db[collection_names["payment_info"]])

    @property
    def client(self) -> MongoClient:
        client = self.db.client
        if not isinstance(client, MongoClient):
            raise ConfigurationError("Database client is not a MongoClient")
        return client

    @staticmethod
    def _owner_fields(
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> dict[str, str | None]:
        if bool(user_id) == bool(organization_id):
            raise InvalidUsageStateError("Exactly one of user_id or organization_id must be provided")
        return {
            "user_id": user_id,
            "organization_id": organization_id,
        }

    @staticmethod
    def _to_response(payment_doc: dict, wallet_doc: dict, *, idempotent_replay: bool) -> CreditAccountResponse:
        return CreditAccountResponse(
            payment_id=payment_doc["id"],
            user_id=payment_doc.get("user_id"),
            organization_id=payment_doc.get("organization_id"),
            status=PaymentStatus(payment_doc["status"]),
            resource_type=payment_doc["resource_type"],
            purchased_units=payment_doc["purchased_units"],
            available_messages=wallet_doc.get("available_messages", 0),
            available_sessions=wallet_doc.get("available_sessions", 0),
            idempotent_replay=idempotent_replay,
        )

    def _build_replay_response(self, payment_doc: dict) -> CreditAccountResponse:
        wallet = self.wallet_repo.get_wallet(
            user_id=payment_doc.get("user_id"),
            organization_id=payment_doc.get("organization_id"),
        ) or {
            "available_messages": 0,
            "available_sessions": 0,
        }
        return self._to_response(payment_doc, wallet, idempotent_replay=True)

    def credit_account(self, request: CreditAccountRequest) -> CreditAccountResponse:
        owner = self._owner_fields(
            user_id=request.user_id,
            organization_id=request.organization_id,
        )
        
        existing = self.payment_repo.find_by_idempotency(
            request.idempotency_key,
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        if existing and existing.get("status") == PaymentStatus.SUCCEEDED.value:
            return self._build_replay_response(existing)

        payment_id = str(uuid4())
        now = datetime.now(timezone.utc)

        def _txn(session):
            payment_doc = {
                "id": payment_id,
                "user_id": owner["user_id"],
                "organization_id": owner["organization_id"],
                "idempotency_key": request.idempotency_key,
                "resource_type": request.resource_type.value,
                "purchased_units": request.purchased_units,
                # "external_payment_id": request.external_payment_id,
                # "amount": request.amount,
                # "currency": request.currency,
                "status": PaymentStatus.PENDING.value,
                "metadata": request.metadata,
                "created_at": now,
                "completed_at": None,
            }
            self.payment_repo.insert_payment(payment_doc, session)

            if not self.wallet_repo.add_wallet_credit(
                request.resource_type.value,
                request.purchased_units,
                session,
                user_id=owner["user_id"],
                organization_id=owner["organization_id"],
            ):
                raise InvalidUsageStateError("Wallet not found during payment crediting")

            if not self.payment_repo.mark_payment_succeeded(
                payment_id,
                session,
                user_id=owner["user_id"],
                organization_id=owner["organization_id"],
            ):
                raise InvalidUsageStateError("Payment state was changed concurrently")

            payment_doc["status"] = PaymentStatus.SUCCEEDED.value
            payment_doc["completed_at"] = datetime.now(timezone.utc)
            return payment_doc

        try:
            payment_doc = run_transaction_with_retry(self.client, _txn)
            wallet = self.wallet_repo.get_wallet(
                user_id=owner["user_id"],
                organization_id=owner["organization_id"],
            ) or {
                "available_messages": 0,
                "available_sessions": 0,
            }
            return self._to_response(payment_doc, wallet, idempotent_replay=False)
        except DuplicateKeyError:
            duplicate = self.payment_repo.find_by_idempotency(
                request.idempotency_key,
                user_id=owner["user_id"],
                organization_id=owner["organization_id"],
            )
            if duplicate:
                return self._build_replay_response(duplicate)
            raise

    def list_payments(
        self,
        *,
        page: int,
        page_size: int,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> PaymentInfoPageView:
        if user_id and organization_id:
            raise InvalidUsageStateError("Only one of user_id or organization_id can be provided")

        skip = (page - 1) * page_size
        docs = self.payment_repo.list_paginated(
            skip=skip,
            limit=page_size,
            user_id=user_id,
            organization_id=organization_id,
        )
        total = self.payment_repo.count(user_id=user_id, organization_id=organization_id)
        return PaymentInfoPageView(
            items=[PaymentInfoDocument(**doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
