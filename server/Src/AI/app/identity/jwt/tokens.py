import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any


class JwtTokenValidationError(Exception):
    pass


@dataclass(frozen=True)
class JwtIdentitySubject:
    subject: str
    token_type: str
    expires_at: datetime


class JwtTokenService:
    algorithm = "HS256"
    token_type = "JWT"

    def __init__(self, secret: str, ttl_seconds: int):
        self.secret = secret.encode("utf-8")
        self.ttl_seconds = ttl_seconds

    def create_access_token(self, user_id: str, now: datetime | None = None) -> tuple[str, datetime]:
        issued_at = now or datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(seconds=self.ttl_seconds)
        payload = {
            "sub": user_id,
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
            "typ": "access",
        }
        return self._encode(payload), expires_at

    def create_guest_access_token(self, guest_user_id: str, now: datetime | None = None) -> tuple[str, datetime]:
        issued_at = now or datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(seconds=self.ttl_seconds)
        payload = {
            "sub": guest_user_id,
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
            "typ": "guest_access",
            "owner_type": "guest",
        }
        return self._encode(payload), expires_at

    def create_organization_api_key(
        self,
        organization_id: str,
        key_id: str,
        now: datetime | None = None,
        ttl_seconds: int | None = None,
    ) -> tuple[str, datetime]:
        issued_at = now or datetime.now(timezone.utc)
        expires_at = issued_at + timedelta(seconds=ttl_seconds or self.ttl_seconds)
        payload = {
            "sub": organization_id,
            "iat": int(issued_at.timestamp()),
            "exp": int(expires_at.timestamp()),
            "typ": "organization_api_key",
            "jti": key_id,
            "owner_type": "organization",
        }
        return self._encode(payload), expires_at

    def resolve_user_id(self, token: str, now: datetime | None = None) -> str:
        payload = self._decode(token)
        if payload.get("typ") != "access":
            raise JwtTokenValidationError("Invalid token type")

        self._validate_expiration(payload, now)

        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise JwtTokenValidationError("Token subject is missing")
        return user_id

    def resolve_guest_user_id(self, token: str, now: datetime | None = None) -> str:
        payload = self._decode(token)
        if payload.get("typ") != "guest_access":
            raise JwtTokenValidationError("Invalid token type")

        self._validate_expiration(payload, now)

        guest_user_id = payload.get("sub")
        if not isinstance(guest_user_id, str) or not guest_user_id:
            raise JwtTokenValidationError("Token subject is missing")
        return guest_user_id

    def resolve_identity_subject(self, token: str, now: datetime | None = None) -> JwtIdentitySubject:
        payload = self._decode(token)
        token_type = payload.get("typ")
        if token_type not in ("access", "guest_access"):
            raise JwtTokenValidationError("Invalid token type")

        expires_at = self._validate_expiration(payload, now)

        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise JwtTokenValidationError("Token subject is missing")

        return JwtIdentitySubject(
            subject=subject,
            token_type=token_type,
            expires_at=expires_at,
        )

    def resolve_organization_api_key(
        self, token: str, now: datetime | None = None
    ) -> tuple[str, str, datetime]:
        payload = self._decode(token)
        if payload.get("typ") != "organization_api_key":
            raise JwtTokenValidationError("Invalid token type")

        expires_at = self._validate_expiration(payload, now)

        organization_id = payload.get("sub")
        if not isinstance(organization_id, str) or not organization_id:
            raise JwtTokenValidationError("Token subject is missing")

        key_id = payload.get("jti")
        if not isinstance(key_id, str) or not key_id:
            raise JwtTokenValidationError("Token id is missing")

        return organization_id, key_id, expires_at

    def _encode(self, payload: dict[str, Any]) -> str:
        header = {"alg": self.algorithm, "typ": self.token_type}
        signing_input = ".".join(
            [
                _base64url_encode_json(header),
                _base64url_encode_json(payload),
            ]
        )
        signature = self._sign(signing_input)
        return f"{signing_input}.{signature}"

    def _decode(self, token: str) -> dict[str, Any]:
        parts = token.split(".")
        if len(parts) != 3:
            raise JwtTokenValidationError("Invalid token format")

        signing_input = ".".join(parts[:2])
        expected_signature = self._sign(signing_input)
        if not hmac.compare_digest(parts[2], expected_signature):
            raise JwtTokenValidationError("Invalid token signature")

        header = _base64url_decode_json(parts[0])
        if header.get("alg") != self.algorithm or header.get("typ") != self.token_type:
            raise JwtTokenValidationError("Invalid token header")

        payload = _base64url_decode_json(parts[1])
        if not isinstance(payload, dict):
            raise JwtTokenValidationError("Invalid token payload")
        return payload

    def _validate_expiration(
        self, payload: dict[str, Any], now: datetime | None = None
    ) -> datetime:
        expires_at = payload.get("exp")
        if not isinstance(expires_at, int):
            raise JwtTokenValidationError("Token expiration is missing")

        current_time = now or datetime.now(timezone.utc)
        if expires_at <= int(current_time.timestamp()):
            raise JwtTokenValidationError("Token is expired")

        return datetime.fromtimestamp(expires_at, timezone.utc)

    def _sign(self, signing_input: str) -> str:
        digest = hmac.new(self.secret, signing_input.encode("utf-8"), hashlib.sha256).digest()
        return _base64url_encode(digest)


def _base64url_encode_json(value: dict[str, Any]) -> str:
    payload = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _base64url_encode(payload)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode_json(value: str) -> dict[str, Any]:
    try:
        decoded = base64.urlsafe_b64decode(_pad_base64(value))
        result = json.loads(decoded.decode("utf-8"))
    except (ValueError, TypeError) as exc:
        raise JwtTokenValidationError("Invalid token encoding") from exc

    if not isinstance(result, dict):
        raise JwtTokenValidationError("Invalid token JSON")
    return result


def _pad_base64(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return f"{value}{padding}".encode("ascii")
