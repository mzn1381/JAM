import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

from app.chat.logger import get_logger
from app.usage.domain.enums import BillingModel, ResourceType, UsageLogStatus
from app.usage.domain.errors import (
    ConfigurationError,
    InsufficientCreditsError,
    InvalidUsageStateError,
    UsageNotFoundError,
)
from app.usage.infrastructure.MongoUsageLogRepository import (
    MongoUsageLogRepository,
)
from app.usage.infrastructure.transaction import run_transaction_with_retry
from app.usage.models import (
    UsageLogRequestDocument,
    UsageAuthorizeRequest,
    UsageCheckResponse,
    UsageFailedRequest,
    UsageFinalizeRequest,
    UsageFinalizeResponse,
    UsageLogsPageView,
    WalletView,
)
from app.usage.services.pricing import PricingEngine
from app.usage.infrastructure.MongoWalletRepository import MongoWalletRepository


logger = get_logger("usage_service")


class UsageService:
    GUEST_USER_PREFIX = "guest:"
    GUEST_MESSAGE_LIMIT = 5
    GUEST_WINDOW_SECONDS = 60

    def __init__(
        self,
        db: Database,
        collection_names: dict[str, str],
        pricing_engine: PricingEngine,
    ):
        self.db = db
        self.collection_names = collection_names
        self.pricing_engine = pricing_engine

        self.wallet_repo = MongoWalletRepository(db[collection_names["wallets"]])
        self.usage_log_repo = MongoUsageLogRepository(db[collection_names["usage_log"]])

    @property
    def client(self) -> MongoClient:
        client = self.db.client
        if not isinstance(client, MongoClient):
            raise ConfigurationError("Database client is not a MongoClient")
        return client

    @staticmethod
    def _resolve_owner(
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
        required: bool = True,
    ) -> dict[str, str | None]:
        if user_id and organization_id:
            raise InvalidUsageStateError("Only one of user_id or organization_id can be provided")
        if required and not user_id and not organization_id:
            raise InvalidUsageStateError("Either user_id or organization_id must be provided")
        return {
            "user_id": user_id,
            "organization_id": organization_id,
        }

    def get_wallet(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> WalletView:
        owner = self._resolve_owner(user_id=user_id, organization_id=organization_id)
        wallet = self.wallet_repo.get_wallet(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        if not wallet:
            owner_type = "user" if owner["user_id"] else "organization"
            owner_value = owner["user_id"] or owner["organization_id"]
            raise UsageNotFoundError(f"Wallet for {owner_type} '{owner_value}' not found")
        return WalletView(**wallet)

    def ensure_wallet(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> WalletView:
        owner = self._resolve_owner(user_id=user_id, organization_id=organization_id)
        wallet = self.wallet_repo.ensure_wallet(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        return WalletView(**wallet)

    @staticmethod
    def _is_guest_user(user_id: str | None) -> bool:
        return bool(user_id) and user_id.startswith(UsageService.GUEST_USER_PREFIX)

    def _assert_guest_rate_limit(self, *, user_id: str, endpoint: str) -> None:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=self.GUEST_WINDOW_SECONDS)
        recent_count = self.usage_log_repo.count_in_window(
            start=window_start,
            end=now,
            status=UsageLogStatus.SUCCEEDED.value,
            endpoint=endpoint,
            user_id=user_id,
        )
        if recent_count >= self.GUEST_MESSAGE_LIMIT:
            raise InsufficientCreditsError("Guest limit reached: only 5 messages per minute are allowed")

    @staticmethod
    def _duration_ms_since(received_at: datetime | None) -> int:
        if received_at is None:
            return 0
        if received_at.tzinfo is None:
            received_at = received_at.replace(tzinfo=timezone.utc)
        duration = datetime.now(timezone.utc) - received_at
        return max(0, int(duration.total_seconds() * 1000))

    @staticmethod
    def _billing_enabled() -> bool:
        load_dotenv()
        return os.getenv("USAGE_BILLING_ENABLED", "false").lower() == "true"

    @staticmethod
    def _parse_billing_model(raw_value: BillingModel | str | None) -> BillingModel | None:
        if raw_value is None:
            return None
        if isinstance(raw_value, BillingModel):
            return raw_value
        try:
            return BillingModel(raw_value)
        except ValueError:
            return None

    def _noop_check_response(self) -> UsageCheckResponse:
        pricing = self.pricing_engine.resolve(None, None)
        return UsageCheckResponse(
            usage_log_id="",
            status=UsageLogStatus.SUCCEEDED,
            resource_type=pricing.resource_type,
            committed_units=0,
            idempotent_replay=False,
        )

    def check_credit(self, request: UsageAuthorizeRequest) -> UsageCheckResponse:
        if not self._billing_enabled():
            return self._noop_check_response()

        owner = self._resolve_owner(user_id=request.user_id, organization_id=request.organization_id)

        if self._is_guest_user(owner["user_id"]):
            guest_user_id = owner["user_id"]
            if guest_user_id is None:
                raise InvalidUsageStateError("Guest user id is missing")
            self._assert_guest_rate_limit(user_id=guest_user_id, endpoint=request.endpoint)
            return self._noop_check_response()

        pricing = self.pricing_engine.resolve(None, None)

        #TODO: implement the session based usage
        if pricing.billing_model == BillingModel.PER_SESSION:
            return UsageCheckResponse(
                usage_log_id="",
                status=UsageLogStatus.SUCCEEDED,
                resource_type=pricing.resource_type,
                committed_units=0,
                idempotent_replay=False,
            )

        wallet = self.wallet_repo.get_wallet(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        if not wallet:
            raise InsufficientCreditsError("Wallet not found")

        if pricing.billing_model == BillingModel.PER_MESSAGE:
            available_field = "available_messages" if pricing.resource_type == ResourceType.MESSAGE else "available_sessions"
            available_units = wallet.get(available_field, 0)
            if available_units < 1:
                raise InsufficientCreditsError("Insufficient credits")

        return UsageCheckResponse(
            usage_log_id="",
            status=UsageLogStatus.SUCCEEDED,
            resource_type=pricing.resource_type,
            committed_units=0,
            idempotent_replay=False,
        )

    def process_usage(self, request: UsageFinalizeRequest) -> UsageFinalizeResponse:
        if not self._billing_enabled():
            return UsageFinalizeResponse(
                usage_log_id="",
                status=UsageLogStatus.SUCCEEDED,
                committed_units=0,
                idempotent_replay=False,
            )

        if not request.user_id and not request.organization_id:
            return UsageFinalizeResponse(
                usage_log_id="",
                status=UsageLogStatus.SUCCEEDED,
                committed_units=0,
                idempotent_replay=False,
            )

        owner = self._resolve_owner(user_id=request.user_id, organization_id=request.organization_id)

        if self._is_guest_user(owner["user_id"]):
            pricing = self.pricing_engine.resolve(None, None)
            usage_log_id = str(uuid4())
            now = datetime.now(timezone.utc)
            usage_log_doc = {
                "id": usage_log_id,
                "user_id": owner["user_id"],
                "organization_id": owner["organization_id"],
                "session_id": request.session_id,
                "endpoint": request.endpoint,
                "trace_id": request.trace_id,
                "billing_model_snapshot": pricing.billing_model.value,
                "resource_type": pricing.resource_type.value,
                "status": UsageLogStatus.SUCCEEDED.value,
                "committed_units": 0,
                "duration_ms": 0,
                "metadata": request.metadata,
                "error_code": None,
                "error_message": None,
                "received_at": now,
                "completed_at": now,
            }
            self.usage_log_repo.insert_succeeded_request(usage_log_doc)
            return UsageFinalizeResponse(
                usage_log_id=usage_log_id,
                status=UsageLogStatus.SUCCEEDED,
                committed_units=0,
                idempotent_replay=False,
            )

        wallet = self.wallet_repo.get_wallet(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        if not wallet:
            raise InsufficientCreditsError("Wallet not found")

        pricing = self.pricing_engine.resolve(None, None)

        if pricing.billing_model == BillingModel.PER_SESSION:
            return UsageFinalizeResponse(
                usage_log_id="",
                status=UsageLogStatus.SUCCEEDED,
                committed_units=0,
                idempotent_replay=False,
            )

        usage_log_id = str(uuid4())
        now = datetime.now(timezone.utc)

        def _txn(session):
            committed_units = 0

            # Deduct credits
            if pricing.billing_model == BillingModel.PER_MESSAGE:
                if not self.wallet_repo.deduct_available(
                    pricing.resource_type.value,
                    1,
                    session,
                    user_id=owner["user_id"],
                    organization_id=owner["organization_id"],
                ):
                    raise InsufficientCreditsError("Insufficient credits")
                committed_units = 1

            # Insert new succeeded log entry
            usage_log_doc = {
                "id": usage_log_id,
                "user_id": owner["user_id"],
                "organization_id": owner["organization_id"],
                "session_id": request.session_id,
                "endpoint": request.endpoint,
                "trace_id": request.trace_id,
                "billing_model_snapshot": pricing.billing_model.value,
                "resource_type": pricing.resource_type.value,
                "status": UsageLogStatus.SUCCEEDED.value,
                "committed_units": committed_units,
                "duration_ms": 0,
                "metadata": request.metadata,
                "error_code": None,
                "error_message": None,
                "received_at": now,
                "completed_at": now,
            }
            self.usage_log_repo.insert_received_request(usage_log_doc, session)

            return UsageFinalizeResponse(
                usage_log_id=usage_log_id,
                status=UsageLogStatus.SUCCEEDED,
                committed_units=committed_units,
                idempotent_replay=False,
            )

        return run_transaction_with_retry(self.client, _txn)

    def log_failed(self, request: UsageFailedRequest) -> None:
        if not self._billing_enabled():
            return

        owner = self._resolve_owner(user_id=request.user_id, organization_id=request.organization_id)

        pricing = self.pricing_engine.resolve(None, None)

        usage_log_id = str(uuid4())
        now = datetime.now(timezone.utc)

        # Insert new failed log entry
        failed_log_doc = {
            "id": usage_log_id,
            "user_id": owner["user_id"],
            "organization_id": owner["organization_id"],
            "session_id": request.session_id,
            "endpoint": request.endpoint,
            "trace_id": request.trace_id,
            "billing_model_snapshot": pricing.billing_model.value,
            "resource_type": pricing.resource_type.value,
            "status": UsageLogStatus.FAILED.value,
            "committed_units": 0,
            "duration_ms": 0,
            "metadata": request.metadata,
            "error_code": request.error_code,
            "error_message": request.error_message,
            "received_at": now,
            "completed_at": now,
        }
        self.usage_log_repo.insert_failed_request(failed_log_doc)

    def list_usage_logs(
        self,
        *,
        page: int,
        page_size: int,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> UsageLogsPageView:
        if user_id and organization_id:
            raise InvalidUsageStateError("Only one of user_id or organization_id can be provided")

        skip = (page - 1) * page_size
        docs = self.usage_log_repo.list_paginated(
            skip=skip,
            limit=page_size,
            user_id=user_id,
            organization_id=organization_id,
        )
        total = self.usage_log_repo.count(user_id=user_id, organization_id=organization_id)
        return UsageLogsPageView(
            items=[UsageLogRequestDocument(**doc) for doc in docs],
            page=page,
            page_size=page_size,
            total=total,
        )
