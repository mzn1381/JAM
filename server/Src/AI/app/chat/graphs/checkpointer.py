import os
from urllib.parse import unquote, urlparse

from langgraph.checkpoint.memory import MemorySaver

from app.chat.logger import get_logger

logger = get_logger("checkpointer")

CHECKPOINTER_PROVIDER = "CHECKPOINTER_PROVIDER"
MONGODB_URI = "MONGODB_URI"
MONGODB_PROVIDER = "mongodb"
DEFAULT_MONGODB_DB_NAME = "pishkar_ai"

_checkpointer = None
_checkpointer_context = None


def _get_mongodb_db_name(mongodb_uri: str) -> str:
    path = urlparse(mongodb_uri).path.strip("/")
    if not path:
        return DEFAULT_MONGODB_DB_NAME

    return unquote(path.split("/", 1)[0]) or DEFAULT_MONGODB_DB_NAME


def get_checkpointer():
    global _checkpointer, _checkpointer_context

    if _checkpointer is not None:
        return _checkpointer

    provider = os.getenv(CHECKPOINTER_PROVIDER, "").strip().lower()

    if provider == MONGODB_PROVIDER:
        mongodb_uri = os.getenv(MONGODB_URI)
        if not mongodb_uri:
            raise RuntimeError(f"{MONGODB_URI} is required when {CHECKPOINTER_PROVIDER}=mongodb")

        try:
            from langgraph.checkpoint.mongodb import MongoDBSaver
        except ImportError as exc:
            raise RuntimeError(
                "langgraph-checkpoint-mongodb is required when CHECKPOINTER_PROVIDER=mongodb"
            ) from exc

        db_name = _get_mongodb_db_name(mongodb_uri)
        logger.info(f"Using MongoDB LangGraph checkpointer database: {db_name}")
        _checkpointer_context = MongoDBSaver.from_conn_string(mongodb_uri, db_name=db_name)
        _checkpointer = _checkpointer_context.__enter__()
        return _checkpointer

    logger.info("Using in-memory LangGraph checkpointer")
    _checkpointer = MemorySaver()
    return _checkpointer
