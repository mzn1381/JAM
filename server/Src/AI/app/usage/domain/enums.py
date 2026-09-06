from enum import Enum


class BillingModel(str, Enum):
    PER_MESSAGE = "PER_MESSAGE"
    PER_SESSION = "PER_SESSION"


class UsageLogStatus(str, Enum):
    RECEIVED = "RECEIVED"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class ResourceType(str, Enum):
    MESSAGE = "MESSAGE"
    SESSION = "SESSION"
