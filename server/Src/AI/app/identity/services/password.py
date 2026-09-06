import hashlib
import hmac
import secrets


_ITERATIONS = 200_000
_ALGO = "sha256"


def new_salt() -> str:
    return secrets.token_hex(16)


def hash_password(password: str, salt: str) -> str:
    derived = hashlib.pbkdf2_hmac(
        _ALGO,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        _ITERATIONS,
    )
    return derived.hex()


def verify_password(password: str, salt: str, expected_hash: str) -> bool:
    candidate = hash_password(password, salt)
    return hmac.compare_digest(candidate, expected_hash)
