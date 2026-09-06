from datetime import datetime, timedelta, timezone

from pymongo.database import Database

from app.chat.logger import get_logger
from app.usage.domain.enums import PaymentStatus, ResourceType
from app.usage.domain.errors import InvalidUsageStateError, UsageNotFoundError
from app.usage.infrastructure.MongoPaymentInfoRepository import MongoPaymentInfoRepository
from app.usage.infrastructure.MongoUsageLogRepository import (
    MongoUsageLogRepository,
)
from app.usage.infrastructure.MongoWalletRepository import MongoWalletRepository
from app.usage.models import (
    DailyUsagePoint,
    UsageDashboardView,
    WalletView,
)


logger = get_logger("dashboard_usage_service")


class DashboardUsageService:
    def __init__(self, db: Database, collection_names: dict[str, str]):
        self.db = db
        self.collection_names = collection_names

        self.wallet_repo = MongoWalletRepository(db[collection_names["wallets"]])
        self.usage_log_repo = MongoUsageLogRepository(db[collection_names["usage_log"]])
        self.payment_repo = MongoPaymentInfoRepository(db[collection_names["payment_info"]])

    @staticmethod
    def _resolve_owner(
        *,
        user_id: str | None,
        organization_id: str | None,
    ) -> dict[str, str | None]:
        if user_id and organization_id:
            raise InvalidUsageStateError(
                "Only one of user_id or organization_id can be provided"
            )
        if not user_id and not organization_id:
            raise InvalidUsageStateError(
                "Either user_id or organization_id must be provided"
            )
        return {"user_id": user_id, "organization_id": organization_id}

    @staticmethod
    def _day_bounds(now: datetime) -> tuple[datetime, datetime]:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
        return start, end

    @staticmethod
    def _month_bounds(now: datetime) -> tuple[datetime, datetime]:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1)
        else:
            end = start.replace(month=start.month + 1)
        return start, end

    def get_dashboard(
        self,
        *,
        user_id: str | None = None,
        organization_id: str | None = None,
    ) -> UsageDashboardView:
        owner = self._resolve_owner(user_id=user_id, organization_id=organization_id)

        wallet_doc = self.wallet_repo.get_wallet(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        if not wallet_doc:
            owner_type = "user" if owner["user_id"] else "organization"
            owner_value = owner["user_id"] or owner["organization_id"]
            raise UsageNotFoundError(
                f"Wallet for {owner_type} '{owner_value}' not found"
            )
        wallet_view = WalletView(**wallet_doc)

        now = datetime.now(timezone.utc)
        day_start, day_end = self._day_bounds(now)
        month_start, month_end = self._month_bounds(now)

        today_summary = self.usage_log_repo.aggregate_usage_summary(
            start=day_start,
            end=day_end,
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        month_summary = self.usage_log_repo.aggregate_usage_summary(
            start=month_start,
            end=month_end,
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        total_messages_bought = self.payment_repo.sum_purchased_units(
            resource_type=ResourceType.MESSAGE.value,
            status=PaymentStatus.SUCCEEDED.value,
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )

        daily_docs = self.usage_log_repo.aggregate_daily_usage(
            start=month_start,
            end=month_end,
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
        )
        daily_map = {
            doc["_id"]: {
                "count": int(doc.get("count", 0)),
            }
            for doc in daily_docs
        }

        daily_series: list[DailyUsagePoint] = []
        cursor = month_start
        while cursor < month_end:
            key = cursor.strftime("%Y-%m-%d")
            entry = daily_map.get(key, {"count": 0})
            daily_series.append(
                DailyUsagePoint(
                    date=key,
                    count=entry["count"],
                )
            )
            cursor += timedelta(days=1)

        return UsageDashboardView(
            user_id=owner["user_id"],
            organization_id=owner["organization_id"],
            wallet=wallet_view,
            total_messages_bought=total_messages_bought,
            today_count=today_summary["count"],
            month_count=month_summary["count"],
            month_start=month_start,
            month_end=month_end,
            daily_usage=daily_series,
        )
