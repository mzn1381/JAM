def format_api_error(exc: BaseException) -> str:
    parts = [f"{type(exc).__name__}: {exc}"]
    cause = exc.__cause__
    while cause:
        parts.append(f"cause={type(cause).__name__}: {cause}")
        cause = cause.__cause__
    return " | ".join(parts)
