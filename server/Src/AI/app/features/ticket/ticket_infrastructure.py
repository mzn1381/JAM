import os

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import OperationFailure

from app.features.ticket.ticket_errors import TicketConfigurationError


_client: MongoClient | None = None
_db: Database | None = None


def _collection_name() -> str:
    prefix = os.getenv("MONGODB_COLLECTION_PREFIX", "").strip()
    return f"{prefix}tickets" if prefix else "tickets"


def get_ticket_collection() -> Collection:
    global _client, _db
    if _db is not None:
        return _db[_collection_name()]

    mongodb_uri = os.getenv("MONGODB_URI", "").strip()
    if not mongodb_uri:
        raise TicketConfigurationError("MONGODB_URI is not configured")

    database_name = os.getenv("MONGODB_DATABASE", "pishkar_ai")
    _client = MongoClient(mongodb_uri, retryWrites=True)
    _db = _client[database_name]
    return _db[_collection_name()]


def ensure_ticket_indexes(collection: Collection) -> None:
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
        name="uq_tickets_id",
    )
    _create_or_replace_named_index(
        [("created_at", DESCENDING)],
        name="ix_tickets_created_at",
    )
