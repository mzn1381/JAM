import logging
import sys
from opentelemetry import trace


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    fmt = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%H:%M:%S"
    )

    ch = logging.StreamHandler(sys.stdout)
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    fh = logging.FileHandler("chat.log", encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    return logger

def get_trace_id():
    span = trace.get_current_span()
    span_context = span.get_span_context()

    if not span_context.is_valid:
        return None

    # 32-character hex string
    return format(span_context.trace_id, "032x")