from collections import Counter
from threading import Lock

from app.chat.logger import get_logger

logger = get_logger("metrics")

_lock = Lock()
_safeguard_blocks: Counter[str] = Counter()
_safeguard_passes: int = 0


def record_safeguard_block(reason: str, session_id: str = "") -> None:
    with _lock:
        _safeguard_blocks[reason] += 1
        total = sum(_safeguard_blocks.values())

    logger.warning(
        f"metric=safeguard_block | reason={reason} | session_id={session_id} | "
        f"count_reason={_safeguard_blocks[reason]} | total_blocks={total}"
    )


def record_safeguard_pass(session_id: str = "") -> None:
    global _safeguard_passes
    with _lock:
        _safeguard_passes += 1
        passes = _safeguard_passes

    logger.info(
        f"metric=safeguard_pass | session_id={session_id} | total_passes={passes}"
    )


def get_safeguard_stats() -> dict:
    with _lock:
        return {
            "blocks_by_reason": dict(_safeguard_blocks),
            "total_blocks": sum(_safeguard_blocks.values()),
            "total_passes": _safeguard_passes,
        }


def reset_safeguard_stats() -> None:
    global _safeguard_passes
    with _lock:
        _safeguard_blocks.clear()
        _safeguard_passes = 0
