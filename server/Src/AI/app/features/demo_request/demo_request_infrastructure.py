import os

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import OperationFailure

from app.features.demo_request.demo_request_errors import DemoRequestConfigurationError


_client: MongoClient | None = None
_db: Database | None = None


def _collection_name() -> str:
    prefix = os.getenv("MONGODB_COLLECTION_PREFIX", "").strip()
    return f"{prefix}demo_requests" if prefix else "demo_requests"


def get_demo_request_collection() -> Collection:
    global _client, _db
    if _db is not None:
        return _db[_collection_name()]

    mongodb_uri = os.getenv("MONGODB_URI", "").strip()
    if not mongodb_uri:
        raise DemoRequestConfigurationError("MONGODB_URI is not configured")

    database_name = os.getenv("MONGODB_DATABASE", "pishkar_ai")
    _client = MongoClient(mongodb_uri, retryWrites=True)
    _db = _client[database_name]
    return _db[_collection_name()]


def ensure_demo_request_indexes(collection: Collection) -> None:
    def _create_or_replace_named_index(keys, *, name: str, **options) -> None:
        try:
            collection.create_index(keys, name=name, **options)
        except OperationFailure as exc:
            if exc.code in (85, 86):
                collection.drop_index(name)
                collection.create_index(keys, name=name, **options)
                return
            raise

    _create_or_replace_named_index(
        [("id", ASCENDING)],
        unique=True,
        name="uq_demo_requests_id",
    )
    _create_or_replace_named_index(
        [("phone_number", ASCENDING)],
        unique=True,
        name="uq_demo_requests_phone_number",
    )
    _create_or_replace_named_index(
        [("created_at", DESCENDING)],
        name="ix_demo_requests_created_at",
    )
