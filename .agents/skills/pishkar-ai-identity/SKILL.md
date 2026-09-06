# Pishkar AI Identity Skill

Domain knowledge for the FastAPI identity subsystem (users, organizations, memberships, login/JWT auth) living in `server/Src/AI`.

Use this skill whenever a task touches:

- User accounts (create / update / delete / password reset)
- Organizations & memberships (roles, add/remove members)
- Login, logout, `Authorization: Bearer` handling, current user resolution
- Any file under `server/Src/AI/app/identity/**` or `server/Src/AI/app/routers/{identity,user,organization}_endpoints.py`

---

## 1. Layered Architecture

The identity module strictly follows a 4-layer layout under `server/Src/AI/app/identity/`:

```
identity/
├── models.py              # Pydantic request/response/document/view models
├── domain/
│   ├── enums.py           # UserStatus, OrganizationStatus, MembershipRole
│   ├── errors.py          # IdentityError hierarchy (with `.code`)
│   └── repositories.py    # Repository Protocols (structural typing only)
├── infrastructure/
│   ├── mongo.py           # Settings, client bootstrap, index creation
│   ├── MongoUserRepository.py
│   ├── MongoOrganizationRepository.py
│   ├── MongoMembershipRepository.py
│   └── MongoAuthTokenRepository.py
├── jwt/
│   └── tokens.py          # JwtTokenService (custom HS256, no PyJWT)
├── services/
│   ├── password.py        # PBKDF2-SHA256 hash/verify + salt
│   ├── user_service.py
│   ├── organization_service.py
│   └── auth_service.py
└── __init__.py            # Singleton service accessors + bootstrap
```

Router layer:

```
app/routers/
├── identity_common.py         # to_http_error, extract_bearer, resolve_current_user, current_user
├── identity_endpoints.py      # /api/v1/identity/{login,logout,identity_user_info}
├── user_endpoints.py          # /api/v1/users/...
└── organization_endpoints.py  # /api/v1/organizations/...
```

### Dependency Rules

- `routers/` → `services/` → `infrastructure/` → `domain/`
- `models.py` is used by all layers (it's the shared contract).
- `services/` NEVER talks to `pymongo` directly — always through a `Mongo*Repository`.
- `domain/` has zero dependencies on FastAPI, PyMongo, or Pydantic (only `Protocol` + `Enum` + `Exception`).
- Cross-service reuse of `_to_view` is fine (see `OrganizationService._to_user_view` importing lazily from `UserService`).

---

## 2. Data Model (Mongo Collections)

Configured in [server/Src/AI/app/identity/infrastructure/mongo.py](server/Src/AI/app/identity/infrastructure/mongo.py):

| Logical name  | Default collection            | Unique indexes                          |
| ------------- | ----------------------------- | --------------------------------------- |
| `users`       | `users`                       | `id`, `email`                           |
| `organizations` | `organizations`             | `id`, `slug`                            |
| `memberships` | `organization_memberships`    | (`organization_id`, `user_id`) compound |
| `auth_tokens` | `auth_tokens`                 | `token_hash`; TTL on `expires_at`       |

Documents are all plain `dict[str, Any]` at the repository boundary. Pydantic `*Document` classes in `models.py` document the shape but are NOT hydrated by repositories — services build dicts directly.

`_id` is projected out (`{"_id": 0}`) in every read.

### Key fields

- All entities have string `id` — generated via `str(uuid4())` in services, never delegated to Mongo `_id`.
- Emails are stored lowercased (both on write and read lookup).
- Organization slugs are stored lowercased.
- `created_at` / `updated_at` are timezone-aware UTC (`datetime.now(timezone.utc)`).
- Enum values are stored as their string value (`UserStatus.ACTIVE.value` → `"ACTIVE"`).

---

## 3. Models (`app/identity/models.py`)

Three parallel "shapes" per entity — do not conflate them:

- **`XxxDocument`** — full persisted shape including secrets (`password_hash`, `password_salt`, `token_hash`). Never return from an endpoint.
- **`XxxView`** — safe public projection. This is what gets returned from services and endpoints.
- **`XxxRequest`** — inbound validation (e.g. `CreateUserRequest`, `UpdateUserRequest`, `LoginRequest`).

Auth response models: `LoginResponse` (access_token + expires_at + `UserView`), `GuestSessionResponse` (guest access token + guest_user_id), `IdentityTokenResolution` (resolved identity `UserView` + `is_guest` flag), `MeResponse` (user + organizations + memberships).

### Rules when adding fields

1. Add to the `Document` model (for docs), the `View` model (if public-safe), and the corresponding `Request` model (if user-controlled).
2. Update the relevant `_to_view` / `_to_*_view` static method on the service to include it.
3. If it's indexed or unique, add index creation in `ensure_identity_indexes` in `mongo.py`.

---

## 4. Domain Errors

All identity failures raise a subclass of `IdentityError` (from [server/Src/AI/app/identity/domain/errors.py](server/Src/AI/app/identity/domain/errors.py)). Each has a static `code` classvar:

| Exception                          | `code`                         | HTTP |
| ---------------------------------- | ------------------------------ | ---- |
| `UserNotFoundError`                | `USER_NOT_FOUND`               | 404  |
| `OrganizationNotFoundError`        | `ORGANIZATION_NOT_FOUND`       | 404  |
| `MembershipNotFoundError`          | `MEMBERSHIP_NOT_FOUND`         | 404  |
| `UserAlreadyExistsError`           | `USER_ALREADY_EXISTS`          | 409  |
| `OrganizationAlreadyExistsError`   | `ORGANIZATION_ALREADY_EXISTS`  | 409  |
| `MembershipAlreadyExistsError`     | `MEMBERSHIP_ALREADY_EXISTS`    | 409  |
| `InvalidCredentialsError`          | `INVALID_CREDENTIALS`          | 401  |
| `InvalidTokenError`                | `INVALID_TOKEN`                | 401  |
| `ConfigurationError`               | `CONFIGURATION_ERROR`          | 500  |

Mapping is centralized in `to_http_error()` in [server/Src/AI/app/routers/identity_common.py](server/Src/AI/app/routers/identity_common.py). Add new codes there when adding a new error type.

### Rule
- Services **only** raise `IdentityError` subclasses. They must never raise `HTTPException`.
- Routers **only** catch `IdentityError` and convert via `to_http_error(exc)`.

---

## 5. Services

### `UserService`
- `create_user`, `get_user`, `update_user`, `delete_user`
- Passwords are hashed via `hash_password(request.password, salt)` where `salt = new_salt()`. Both stored on the doc.
- On delete: also removes all memberships via `MongoMembershipRepository.delete_by_user`.
- `_to_view` is a `@staticmethod` used by other services too — don't duplicate it.

### `OrganizationService`
- `create_organization`, `get_organization`, `update_organization`, `delete_organization`
- Memberships: `add_member`, `update_member_role`, `remove_member`, `list_organization_members`, `list_user_organizations`
- If `CreateOrganizationRequest.owner_user_id` is set: verifies the user exists and inserts an `OWNER` membership atomically-after the org insert.
- On org delete: also cascades `delete_by_organization`.

### `AuthService`
- `login(LoginRequest) -> LoginResponse`: lowercases email, checks `UserStatus.ACTIVE`, verifies password (constant-time via `hmac.compare_digest`), issues JWT.
- `create_guest_session() -> GuestSessionResponse`: issues a `guest_access` JWT for a generated `guest:{uuid4}` subject.
- `logout(token)`: currently a no-op — JWT is stateless. Adding a blocklist requires wiring `MongoAuthTokenRepository` here.
- `resolve_token(token) -> UserView`: verifies JWT, loads user, ensures still active.
- `resolve_guest_user_id(token) -> str`: verifies a `guest_access` JWT and returns its guest subject.
- `resolve_identity_token(token) -> IdentityTokenResolution`: verifies either a normal `access` or `guest_access` JWT through `JwtTokenService.resolve_identity_subject(...)`; returns a regular active `UserView` for normal users or a synthetic guest `UserView` with `UserStatus.GUEST`. Use this when an endpoint must accept both registered-user and guest tokens. Do not use nested exception probing to distinguish normal vs guest tokens.

Password hashing: **PBKDF2-HMAC-SHA256, 200,000 iterations**. See [server/Src/AI/app/identity/services/password.py](server/Src/AI/app/identity/services/password.py). Never replace with a plain hash or lower iteration count.

---

## 6. JWT (`app/identity/jwt/tokens.py`)

Custom hand-rolled HS256 JWT — **do not import PyJWT / python-jose**.

- Algorithm: `HS256`, `typ: JWT`.
- Normal user payload: `{sub, iat, exp, typ: "access"}`.
- Guest payload: `{sub, iat, exp, typ: "guest_access", owner_type: "guest"}`.
- `resolve_identity_subject(token) -> JwtIdentitySubject` accepts only `access` and `guest_access` token types and returns the decoded subject, token type, and expiration as a DTO for service-layer branching.
- Signature verified with `hmac.compare_digest`.
- Errors raise `JwtTokenValidationError` inside the jwt package, converted to `InvalidTokenError` at the `AuthService` boundary.
- Secret comes from env `IDENTITY_JWT_SECRET` (falls back to `MONGODB_URI` — that fallback is a known intentional dev convenience).
- TTL from env `IDENTITY_TOKEN_TTL_SECONDS`, default **7 days**.

---

## 7. Bootstrap & DI (`app/identity/__init__.py`)

Three module-level singletons: `_user_service`, `_organization_service`, `_auth_service`.

Accessors:
- `get_user_service()`
- `get_organization_service()`
- `get_auth_service()`

Each calls `_bootstrap()` on first use, which:
1. Loads `IdentitySettings` from env.
2. Opens the Mongo client (once, cached in `mongo.py`).
3. Runs `ensure_identity_indexes(...)` (idempotent; drops+recreates on option-mismatch code 85/86).

### Rules
- Routers **must** call `get_xxx_service()` inside the handler, not at import time. This defers Mongo connection to first request and keeps tests import-safe.
- Do not add DI via FastAPI `Depends(...)` for these services — the codebase uses the singleton-accessor style consistently.

---

## 8. Routers & Endpoint Conventions

Router prefix / tag pattern:

- Identity/auth: `prefix="/api/v1/identity"`, tag `"identity"`
- Users: `prefix="/api/v1"`, tag `"users"`, paths under `/users/...`
- Organizations: `prefix="/api/v1"`, tag `"organizations"`, paths under `/organizations/...`

Register new routers in [server/Src/AI/app/routers/__init__.py](server/Src/AI/app/routers/__init__.py) by appending to `all_routers`.

### Response envelope

Every endpoint returns `ApiResponse[T]` from [server/Src/AI/app/core/response_model.py](server/Src/AI/app/core/response_model.py):

```python
return ApiResponse.ok(data=..., message="...")
```

- `response_model=ApiResponse[SomeView]` MUST be set on the decorator.
- Use `status_code=201` for creations.
- On `IdentityError`: `raise to_http_error(exc) from exc`.

### Auth-required endpoints

Two idiomatic patterns exist:

**Explicit header helper**:
```python
def identity_user_info(
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> ApiResponse[MeResponse]:
    user = resolve_current_user(authorization)
    ...
```

**Current-user dependency**:
```python
from app.routers.identity_common import current_user
def handler(user: UserView = Depends(current_user)): ...
```

**Bearer token dependency** (used when the handler decides the accepted token types):
```python
from app.routers.identity_common import require_bearer_token
def handler(token: str = Depends(require_bearer_token)): ...
```

Use `require_bearer_token` plus `AuthService.resolve_identity_token(...)` for endpoints that accept both registered-user and guest identity tokens, such as `identity_user_info`.

---

## 9. Environment Variables

From `IdentitySettings.load_identity_settings()`:

| Var                          | Required | Default                        | Notes |
| ---------------------------- | -------- | ------------------------------ | ----- |
| `MONGODB_URI`                | yes      | —                              | Raises `ConfigurationError` if missing |
| `MONGODB_DATABASE`           | no       | `pishkar_ai`                   | |
| `IDENTITY_TOKEN_TTL_SECONDS` | no       | `604800` (7 days)              | Invalid ints silently fall back |
| `IDENTITY_JWT_SECRET`        | no       | falls back to `MONGODB_URI`    | Set in prod |

There is **no** collection prefix env — `collection_prefix` is hardcoded to `""`.

---

## 10. Adding a New Identity Feature — Checklist

When adding a new endpoint (e.g. "invite user by email"):

1. **Model** — Add `InviteUserRequest` / any new views to `app/identity/models.py`.
2. **Error(s)** — Add exception class(es) to `domain/errors.py` with a unique `code`. Wire the code → HTTP status in `to_http_error` inside `routers/identity_common.py`.
3. **Repository** — If a new collection or query shape is needed:
   - Add the `Protocol` method to `domain/repositories.py`.
   - Implement in the appropriate `Mongo*Repository`.
   - Add indexes in `ensure_identity_indexes`.
4. **Service** — Add the method on `UserService` / `OrganizationService` / `AuthService`. Raise `IdentityError` subclasses only. Return a `*View`, never a `*Document`.
5. **Router** — Add the endpoint to the correct `*_endpoints.py`. Follow the `try / except IdentityError / to_http_error` pattern. Wrap the return in `ApiResponse.ok(...)`.
6. **Register** — If it's a new router file, append it to `all_routers` in `app/routers/__init__.py`.

Do **not**:
- Add new singletons outside `app/identity/__init__.py`.
- Raise `HTTPException` inside a service.
- Return raw dicts or `*Document` types from a route.
- Use `_id` — always use the string `id` field.
- Bypass the password module — always go through `hash_password` / `verify_password` / `new_salt`.
- Introduce a new JWT library — extend `JwtTokenService` instead.

---

## 11. Existing Endpoint Reference

### Auth ([identity_endpoints.py](server/Src/AI/app/routers/identity_endpoints.py))
- `POST /api/v1/identity/login` → `LoginResponse`
- `POST /api/v1/identity/logout` (Bearer) → `None`
- `POST /api/v1/identity/guest-session` → `GuestSessionResponse`
- `GET  /api/v1/identity/identity_user_info` (Bearer user or guest token) → `MeResponse`; guest tokens return a synthetic `UserView` with `status=UserStatus.GUEST` and empty `organizations` / `memberships`.

### Users ([user_endpoints.py](server/Src/AI/app/routers/user_endpoints.py))
- `POST   /api/v1/users` → `UserView` (201)
- `GET    /api/v1/users/{user_id}` → `UserView`
- `PATCH  /api/v1/users/{user_id}` → `UserView`
- `DELETE /api/v1/users/{user_id}` → `None`
- `GET    /api/v1/users/{user_id}/organizations` → `list[OrganizationView]`

### Organizations ([organization_endpoints.py](server/Src/AI/app/routers/organization_endpoints.py))
- `POST   /api/v1/organizations` → `OrganizationView` (201)
- `GET    /api/v1/organizations/{org_id}` → `OrganizationView`
- `PATCH  /api/v1/organizations/{org_id}` → `OrganizationView`
- `DELETE /api/v1/organizations/{org_id}` → `None`
- `POST   /api/v1/organizations/{org_id}/members` → `MembershipView` (201)
- `PATCH  /api/v1/organizations/{org_id}/members/{user_id}` → `MembershipView`
- `DELETE /api/v1/organizations/{org_id}/members/{user_id}` → `None`
- `GET    /api/v1/organizations/{org_id}/members` → `list[UserView]`

---
