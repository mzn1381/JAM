import os
from dataclasses import dataclass

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import OperationFailure

from app.identity.domain.errors import ConfigurationError


@dataclass(frozen=True)
class IdentitySettings:
    mongodb_uri: str
    database_name: str
    collection_prefix: str
    token_ttl_seconds: int
    jwt_secret: str


def load_identity_settings() -> IdentitySettings:
    mongodb_uri = os.getenv("MONGODB_URI", "").strip()
    if not mongodb_uri:
        raise ConfigurationError("MONGODB_URI is not configured")

    database_name = os.getenv("MONGODB_DATABASE", "pishkar_ai")
    collection_prefix = ""

    ttl_raw = os.getenv("IDENTITY_TOKEN_TTL_SECONDS", "").strip()
    try:
        token_ttl_seconds = int(ttl_raw) if ttl_raw else 60 * 60 * 24 * 7
    except ValueError:
        token_ttl_seconds = 60 * 60 * 24 * 7

    jwt_secret = os.getenv("IDENTITY_JWT_SECRET", "").strip() or mongodb_uri

    return IdentitySettings(
        mongodb_uri=mongodb_uri,
        database_name=database_name,
        collection_prefix=collection_prefix,
        token_ttl_seconds=token_ttl_seconds,
        jwt_secret=jwt_secret,
    )


_client: MongoClient | None = None
_db: Database | None = None


def _name(settings: IdentitySettings, base: str) -> str:
    if not settings.collection_prefix:
        return base
    return f"{settings.collection_prefix}{base}"


def get_identity_db() -> tuple[Database, IdentitySettings]:
    global _client, _db
    if _db is not None:
        return _db, load_identity_settings()

    settings = load_identity_settings()
    _client = MongoClient(settings.mongodb_uri, retryWrites=True)
    _db = _client[settings.database_name]
    return _db, settings


def get_collections(db: Database, settings: IdentitySettings) -> dict[str, str]:
    return {
        "users": _name(settings, "users"),
        "organizations": _name(settings, "organizations"),
        "memberships": _name(settings, "organization_memberships"),
        "auth_tokens": _name(settings, "auth_tokens"),
        "wallets": _name(settings, "wallets"),
    }


def ensure_identity_indexes(db: Database, names: dict[str, str]) -> None:
    def _create_or_replace_named_index(collection: Collection, keys, *, name: str, **options) -> None:
        try:
            collection.create_index(keys, name=name, **options)
        except OperationFailure as exc:
            if exc.code in (85, 86):
                collection.drop_index(name)
                collection.create_index(keys, name=name, **options)
                return
            raise

    users_collection = db[names["users"]]
    _create_or_replace_named_index(
        users_collection,
        [("id", ASCENDING)],
        unique=True,
        name="uq_users_id",
    )
    _create_or_replace_named_index(
        users_collection,
        [("email", ASCENDING)],
        unique=True,
        name="uq_users_email",
    )
    _create_or_replace_named_index(
        users_collection,
        [("phone_number", ASCENDING)],
        unique=True,
        name="uq_users_phone_number",
    )

    organizations_collection = db[names["organizations"]]
    _create_or_replace_named_index(
        organizations_collection,
        [("id", ASCENDING)],
        unique=True,
        name="uq_organizations_id",
    )
    _create_or_replace_named_index(
        organizations_collection,
        [("slug", ASCENDING)],
        unique=True,
        name="uq_organizations_slug",
    )

    memberships_collection = db[names["memberships"]]
    _create_or_replace_named_index(
        memberships_collection,
        [("organization_id", ASCENDING), ("user_id", ASCENDING)],
        unique=True,
        name="uq_memberships_org_user",
    )
    _create_or_replace_named_index(
        memberships_collection,
        [("user_id", ASCENDING)],
        name="ix_memberships_user",
    )

    tokens_collection = db[names["auth_tokens"]]
    _create_or_replace_named_index(
        tokens_collection,
        [("token_hash", ASCENDING)],
        unique=True,
        name="uq_auth_tokens_token_hash",
    )
    _create_or_replace_named_index(
        tokens_collection,
        [("user_id", ASCENDING)],
        name="ix_auth_tokens_user",
    )
    _create_or_replace_named_index(
        tokens_collection,
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        name="ttl_auth_tokens_expires_at",
    )
