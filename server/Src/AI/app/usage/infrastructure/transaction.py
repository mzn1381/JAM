import random
import time
from typing import Callable, TypeVar

from pymongo import MongoClient
from pymongo.client_session import ClientSession
from pymongo.errors import ConnectionFailure, OperationFailure

T = TypeVar("T")


def _is_retryable(exc: Exception) -> bool:
    if isinstance(exc, (ConnectionFailure, TimeoutError)):
        return True
    if isinstance(exc, OperationFailure):
        return exc.has_error_label("TransientTransactionError") or exc.has_error_label("UnknownTransactionCommitResult")
    return False


def _is_transaction_unsupported(exc: Exception) -> bool:
    if not isinstance(exc, OperationFailure):
        return False
    return exc.code == 20 and "Transaction numbers are only allowed" in str(exc)


def run_transaction_with_retry(
    client: MongoClient,
    operation: Callable[[ClientSession | None], T],
    *,
    attempts: int = 5,
    base_delay_ms: int = 25,
) -> T:
    last_exc: Exception | None = None

    for attempt in range(1, attempts + 1):
        with client.start_session() as session:
            try:
                with session.start_transaction():
                    return operation(session)
            except Exception as exc:  # pragma: no cover - branch is tested by integration behavior
                last_exc = exc
                if _is_transaction_unsupported(exc):
                    return operation(None)
                if attempt >= attempts or not _is_retryable(exc):
                    raise

        sleep_ms = (2 ** (attempt - 1)) * base_delay_ms
        sleep_ms = random.randint(0, sleep_ms)
        time.sleep(sleep_ms / 1000.0)

    if last_exc:
        raise last_exc
    raise RuntimeError("Transaction retry failed with no exception")
