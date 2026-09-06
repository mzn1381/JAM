import os
from dataclasses import dataclass

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import OperationFailure

from app.usage.domain.enums import BillingModel
from app.usage.domain.errors import ConfigurationError


@dataclass(frozen=True)
class UsageSettings:
    mongodb_uri: str
    database_name: str
    collection_prefix: str
    default_billing_model: BillingModel
    jwt_secret: str
    api_key_ttl_seconds: int


def load_usage_settings() -> UsageSettings:
    mongodb_uri = os.getenv("MONGODB_URI", "").strip()
    if not mongodb_uri:
        raise ConfigurationError("MONGODB_URI is not configured")

    database_name = os.getenv("MONGODB_DATABASE", "pishkar_ai")
    collection_prefix = ""

    default_billing_raw = BillingModel.PER_MESSAGE.value
    default_billing_model = BillingModel(default_billing_raw)

    jwt_secret = os.getenv("IDENTITY_JWT_SECRET", "").strip() or mongodb_uri
    ttl_raw = os.getenv("ORGANIZATION_API_KEY_TTL_SECONDS", "").strip()
    try:
        api_key_ttl_seconds = int(ttl_raw) if ttl_raw else 60 * 60 * 24 * 365
    except ValueError:
        api_key_ttl_seconds = 60 * 60 * 24 * 365

    return UsageSettings(
        mongodb_uri=mongodb_uri,
        database_name=database_name,
        collection_prefix=collection_prefix,
        default_billing_model=default_billing_model,
        jwt_secret=jwt_secret,
        api_key_ttl_seconds=api_key_ttl_seconds,
    )


_client: MongoClient | None = None
_db: Database | None = None


def _name(settings: UsageSettings, base: str) -> str:
    if not settings.collection_prefix:
        return base
    return f"{settings.collection_prefix}{base}"


def get_usage_db() -> tuple[Database, UsageSettings]:
    global _client, _db
    if _db is not None:
        return _db, load_usage_settings()

    settings = load_usage_settings()
    _client = MongoClient(settings.mongodb_uri, retryWrites=False)
    _db = _client[settings.database_name]
    return _db, settings


def get_collections(db: Database, settings: UsageSettings) -> dict[str, str]:
    return {
        "accounts": _name(settings, "accounts"),
        "wallets": _name(settings, "wallets"),
        "payment_info": _name(settings, "payment_info"),
        "usage_log": _name(settings, "usage_log"),
        "organization_api_keys": _name(settings, "organization_api_keys"),
    }


def ensure_usage_indexes(db: Database, names: dict[str, str]) -> None:
    def _create_or_replace_named_index(collection: Collection, keys, *, name: str, **options) -> None:
        try:
            collection.create_index(keys, name=name, **options)
        except OperationFailure as exc:
            # Legacy deployments can have an index with the same name but different options
            # (e.g. partialFilterExpression). Replace it with the canonical definition.
            if exc.code in (85, 86):
                collection.drop_index(name)
                collection.create_index(keys, name=name, **options)
                return
            raise

    wallets_collection = db[names["wallets"]]
    _create_or_replace_named_index(
        wallets_collection,
        [("user_id", ASCENDING)],
        unique=True,
        partialFilterExpression={"user_id": {"$type": "string"}},
        name="uq_wallets_user_id",
    )
    _create_or_replace_named_index(
        wallets_collection,
        [("organization_id", ASCENDING)],
        unique=True,
        partialFilterExpression={"organization_id": {"$type": "string"}},
        name="uq_wallets_organization_id",
    )

    usage_log_collection = db[names["usage_log"]]
    _create_or_replace_named_index(
        usage_log_collection,
        [("user_id", ASCENDING), ("id", ASCENDING)],
        unique=True,
        partialFilterExpression={"user_id": {"$type": "string"}},
        name="uq_usage_log_request_user_id",
    )
    _create_or_replace_named_index(
        usage_log_collection,
        [("organization_id", ASCENDING), ("id", ASCENDING)],
        unique=True,
        partialFilterExpression={"organization_id": {"$type": "string"}},
        name="uq_usage_log_request_organization_id",
    )
    _create_or_replace_named_index(
        usage_log_collection,
        [("user_id", ASCENDING), ("status", ASCENDING), ("received_at", DESCENDING)],
        partialFilterExpression={"user_id": {"$type": "string"}},
        name="ix_usage_log_request_user_status_received",
    )
    _create_or_replace_named_index(
        usage_log_collection,
        [("organization_id", ASCENDING), ("status", ASCENDING), ("received_at", DESCENDING)],
        partialFilterExpression={"organization_id": {"$type": "string"}},
        name="ix_usage_log_request_account_status_received",
    )
    _create_or_replace_named_index(
        usage_log_collection,
        [("endpoint", ASCENDING), ("received_at", DESCENDING)],
        name="ix_usage_log_request_endpoint_received",
    )
    _create_or_replace_named_index(
        usage_log_collection,
        [("trace_id", ASCENDING), ("received_at", DESCENDING)],
        name="ix_usage_log_request_trace_received",
    )

    payment_info_collection = db[names["payment_info"]]
    _create_or_replace_named_index(
        payment_info_collection,
        [("user_id", ASCENDING), ("idempotency_key", ASCENDING)],
        unique=True,
        partialFilterExpression={"user_id": {"$type": "string"}},
        name="uq_payment_info_user_idempotency",
    )
    _create_or_replace_named_index(
        payment_info_collection,
        [("organization_id", ASCENDING), ("idempotency_key", ASCENDING)],
        unique=True,
        partialFilterExpression={"organization_id": {"$type": "string"}},
        name="uq_payment_info_organization_idempotency",
    )
    _create_or_replace_named_index(
        payment_info_collection,
        [("user_id", ASCENDING), ("created_at", DESCENDING)],
        partialFilterExpression={"user_id": {"$type": "string"}},
        name="ix_payment_info_user_created",
    )
    _create_or_replace_named_index(
        payment_info_collection,
        [("organization_id", ASCENDING), ("created_at", DESCENDING)],
        partialFilterExpression={"organization_id": {"$type": "string"}},
        name="ix_payment_info_account_created",
    )

    api_keys_collection = db[names["organization_api_keys"]]
    _create_or_replace_named_index(
        api_keys_collection,
        [("id", ASCENDING)],
        unique=True,
        name="uq_organization_api_keys_id",
    )
    _create_or_replace_named_index(
        api_keys_collection,
        [("token_hash", ASCENDING)],
        unique=True,
        name="uq_organization_api_keys_token_hash",
    )
    _create_or_replace_named_index(
        api_keys_collection,
        [("organization_id", ASCENDING), ("created_at", DESCENDING)],
        name="ix_organization_api_keys_org_created",
    )
    _create_or_replace_named_index(
        api_keys_collection,
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="ttl_organization_api_keys_expires_at",
    )
