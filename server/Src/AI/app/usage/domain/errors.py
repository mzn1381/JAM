class UsageError(Exception):
    code = "USAGE_ERROR"


class ConfigurationError(UsageError):
    code = "CONFIGURATION_ERROR"


class InsufficientCreditsError(UsageError):
    code = "INSUFFICIENT_CREDITS"


class UsageNotFoundError(UsageError):
    code = "USAGE_NOT_FOUND"


class InvalidUsageStateError(UsageError):
    code = "INVALID_USAGE_STATE"
