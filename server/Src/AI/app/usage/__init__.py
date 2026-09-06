from app.usage.infrastructure.mongo import get_collections, get_usage_db
from app.usage.infrastructure.mongo import ensure_usage_indexes
from app.usage.services.dashboard_usage_service import DashboardUsageService
from app.usage.services.payment_service import PaymentService
from app.usage.services.pricing import PricingEngine
from app.usage.services.organization_api_key_service import OrganizationApiKeyService
from app.usage.services.usage_service import UsageService


_usage_service: UsageService | None = None
_payment_service: PaymentService | None = None
_dashboard_usage_service: DashboardUsageService | None = None
_organization_api_key_service: OrganizationApiKeyService | None = None


def get_usage_service() -> UsageService:
    global _usage_service
    if _usage_service is not None:
        return _usage_service

    db, settings = get_usage_db()
    collection_names = get_collections(db, settings)
    ensure_usage_indexes(db, collection_names)

    pricing_engine = PricingEngine(
        default_billing_model=settings.default_billing_model,
    )

    _usage_service = UsageService(
        db=db,
        collection_names=collection_names,
        pricing_engine=pricing_engine,
    )
    return _usage_service


def get_payment_service() -> PaymentService:
    global _payment_service
    if _payment_service is not None:
        return _payment_service

    db, settings = get_usage_db()
    collection_names = get_collections(db, settings)
    ensure_usage_indexes(db, collection_names)

    _payment_service = PaymentService(
        db=db,
        collection_names=collection_names,
    )
    return _payment_service


def get_dashboard_usage_service() -> DashboardUsageService:
    global _dashboard_usage_service
    if _dashboard_usage_service is not None:
        return _dashboard_usage_service

    db, settings = get_usage_db()
    collection_names = get_collections(db, settings)
    ensure_usage_indexes(db, collection_names)

    _dashboard_usage_service = DashboardUsageService(
        db=db,
        collection_names=collection_names,
    )
    return _dashboard_usage_service


def get_organization_api_key_service() -> OrganizationApiKeyService:
    global _organization_api_key_service
    if _organization_api_key_service is not None:
        return _organization_api_key_service

    db, settings = get_usage_db()
    collection_names = get_collections(db, settings)
    ensure_usage_indexes(db, collection_names)

    _organization_api_key_service = OrganizationApiKeyService(
        db=db,
        collection_names=collection_names,
        jwt_secret=settings.jwt_secret,
        api_key_ttl_seconds=settings.api_key_ttl_seconds,
    )
    return _organization_api_key_service
