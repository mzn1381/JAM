import os
from enum import Enum


class Environment(str, Enum):
    DEVELOPMENT = "DEVELOPMENT"
    QC = "QC"
    STAGE = "STAGE"
    PRODUCTION = "PRODUCTION"


def get_environment() -> Environment:
    """Read the current runtime environment from the ENVIRONMENT env var.

    Defaults to DEVELOPMENT if unset or unrecognized.
    """
    raw = os.getenv("ENVIRONMENT", "DEVELOPMENT").strip().upper()
    try:
        return Environment(raw)
    except ValueError:
        return Environment.DEVELOPMENT


def show_security_info() -> bool:
    return get_environment() != Environment.PRODUCTION
