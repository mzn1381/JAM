# Usage Module Skill (`server/Src/AI/app/usage`)

Metering, wallets, payments, and dashboard analytics for the AI service. Backed by MongoDB and toggled by the `USAGE_BILLING_ENABLED` env var (see `UsageService._billing_enabled`).

## Layout

```
app/usage/
  __init__.py                # singleton factories: get_usage_service / get_payment_service / get_dashboard_usage_service
  models.py                  # pydantic requests, responses, documents, dashboard views
  domain/
    enums.py                 # BillingModel, ResourceType, UsageLogStatus, PaymentStatus
    errors.py                # UsageError + InsufficientCreditsError / UsageNotFoundError / InvalidUsageStateError / ConfigurationError
  infrastructure/
    mongo.py                 # UsageSettings, get_usage_db, get_collections, ensure_usage_indexes
    transaction.py           # run_transaction_with_retry (MongoDB session helper)
    MongoWalletRepository.py
    MongoUsageLogRepository.py
    MongoPaymentInfoRepository.py
  services/
    pricing.py               # PricingEngine.resolve(account_doc, override) -> PricingDecision
    usage_service.py         # check_credit / process_usage / log_failed / get_wallet / list_usage_logs
    payment_service.py       # credit_account / list_payments
    dashboard_usage_service.py  # get_dashboard (today, month, remaining credit, daily graph)
```

Router: `app/routers/usage_endpoints.py` (prefix `/api/v1/usage`, tag `usage`).

## MongoDB collections

Resolved via `get_collections(db, settings)` — no prefix by default.

- `wallets` — one doc per owner. Unique partial indexes on `user_id` xor `organization_id`. Fields: `available_messages`, `available_sessions`, `updated_at`. **Source of truth for credit checks and deductions.**
- `usage_log` — one row per authorized/failed request. Unique on `(owner, idempotency_key)` and `(owner, id)`. Status enum `RECEIVED | SUCCEEDED | FAILED`.
- `payment_info` — top-ups. Unique on `(owner, idempotency_key)`.
- `accounts` — legacy owner metadata collection. Still initialized in `get_collections` but no longer read by `UsageService` (billing model comes from `PricingEngine` defaults). `PaymentService` may still reference it if needed.

Indexes are created idempotently in `ensure_usage_indexes` and auto-replaced (`OperationFailure` codes 85/86) when definitions drift.

## Owner rules

Every service call is scoped by **exactly one** of `user_id` or `organization_id`:

- `UsageService._resolve_owner(...)` — enforces XOR (unless `required=False`).
- `PaymentService._owner_fields(...)` — same.
- `DashboardUsageService._resolve_owner(...)` — same.
- `MongoWalletRepository._owner_query(...)` — **raises** if neither provided.
- `MongoUsageLogRepository._owner_query(...)` — returns `{}` when neither provided (allows admin-wide listing); callers must validate.

Always pass owner kwargs through untouched; never merge them into a single field.

## Billing flow

1. Client sends `Idempotency-Key` header, plus `X-User-Id` and/or `X-Account-Id`, on any billable endpoint (see `app/routers/chat_endpoints.py`).
2. `UsageService.check_credit(UsageAuthorizeRequest)` — resolves owner (XOR), loads the wallet, and validates ≥1 unit for `PER_MESSAGE`. `PER_SESSION` is currently a TODO no-op.
3. On success, `UsageService.process_usage(UsageFinalizeRequest)` runs a transaction:
   - `wallet_repo.deduct_available(resource_type, 1, session, ...)` — atomic conditional decrement.
   - Insert a `SUCCEEDED` `usage_log` row with `committed_units=1`.
4. On failure, `UsageService.log_failed(UsageFailedRequest)` inserts a `FAILED` row (no deduction).

Billing model / resource type come from `PricingEngine.resolve(None, None)` — currently the settings default (`PER_MESSAGE` → `MESSAGE`). `UsageService` no longer reads the `accounts` collection.

If billing is disabled, all three return no-op responses with empty `usage_log_id`.

Transactions must go through `run_transaction_with_retry(client, txn_fn)`; do not call `session.start_transaction()` directly.

## Pricing

`PricingEngine.resolve(account_doc, override)` returns a `PricingDecision`:
- If `account_doc` is provided and has a `billing_model` field, it wins; otherwise falls back to the engine default (`BillingModel.PER_MESSAGE` from `UsageSettings`).
- `UsageService` currently passes `None, None` (default only). `PaymentService` still passes an account doc when computing pricing for top-ups.

## Payments

`PaymentService.credit_account(CreditAccountRequest)`:
- Requires `idempotency_key`; on `DuplicateKeyError` it re-reads the existing payment/wallet and returns `idempotent_replay=True`.
- Transactionally inserts `payment_info` (`COMPLETED`) and upserts wallet (`add_wallet_credit`) with the purchased units on the requested `resource_type`.

## Dashboard

`DashboardUsageService.get_dashboard(user_id=..., organization_id=...)` → `UsageDashboardView` containing:
- `wallet` (`WalletView` — remaining credits).
- `today_units` / `today_count` — SUCCEEDED usage since UTC midnight.
- `month_units` / `month_count` — SUCCEEDED usage since the 1st of the current UTC month.
- `daily_usage` — one `DailyUsagePoint` per day of the current month (zero-filled), for graphing.
- `month_start` / `month_end` — inclusive/exclusive bounds used for the query.

Aggregations live on `MongoUsageLogRepository`:
- `aggregate_usage_summary(start, end, ..., status="SUCCEEDED")` → `{units, count}`.
- `aggregate_daily_usage(start, end, ..., timezone_offset="+00:00")` → list of `{_id: "YYYY-MM-DD", units, count}` via `$dateToString`.

All ranges are half-open `[start, end)` in UTC. Missing wallet → `UsageNotFoundError` (mapped to HTTP 404).

## Endpoints (`/api/v1/usage`)

| Method | Path | Handler | Notes |
| --- | --- | --- | --- |
| GET | `/wallet` | `get_wallet` | Query: `user_id` xor `organization_id`. |
| GET | `/usage-logs` | `list_usage_logs` | `page`, `page_size` (1–100). |
| GET | `/payments` | `list_payments` | Same paging. |
| POST | `/payments` | `create_payment` | Body: `CreditAccountRequest`. 201. |
| GET | `/dashboard` | `get_usage_dashboard` | Returns `UsageDashboardView`. |

`_to_http_error` maps `UsageError.code` → status: `INSUFFICIENT_CREDITS` 402, `USAGE_NOT_FOUND` 404, `INVALID_USAGE_STATE` 409, `CONFIGURATION_ERROR` 500, else 400.

## Conventions when extending

- Add new query/aggregation logic to the repositories, not services.
- New services follow the singleton pattern in `app/usage/__init__.py` (`get_xxx_service()` with cached module-level instance and `ensure_usage_indexes` on first init).
- New pydantic models go into `app/usage/models.py` (grouped: requests, responses, documents, views).
- Always feed router responses through `ApiResponse.ok(data=...)`; raise `UsageError` subclasses from services and let `_to_http_error` translate.
- Use `datetime.now(timezone.utc)` — never naive datetimes; Mongo aggregations assume UTC.
- Keep `_billing_enabled()` guards on write paths so tests / local dev without Mongo still work.
