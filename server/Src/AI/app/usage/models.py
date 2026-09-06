from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.usage.domain.enums import BillingModel, PaymentStatus, ResourceType, UsageLogStatus

### Document models for MongoDB collections

class UsageLogRequestDocument(BaseModel):
    id: str
    user_id: str | None = None
    organization_id: str | None = None
    session_id: str
    endpoint: str = ""
    trace_id: str | None = None
    billing_model_snapshot: BillingModel
    resource_type: ResourceType
    status: UsageLogStatus
    committed_units: int = 0
    duration_ms: int = 0
    metadata: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None
    error_message: str | None = None
    received_at: datetime
    completed_at: datetime | None = None


class PaymentInfoDocument(BaseModel):
    id: str
    user_id: str | None = None
    organization_id: str | None = None
    idempotency_key: str
    resource_type: ResourceType
    purchased_units: int
    # external_payment_id: str
    # amount: float
    # currency: str
    status: PaymentStatus
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    completed_at: datetime | None = None


class OrganizationApiKeyDocument(BaseModel):
    id: str
    organization_id: str
    name: str | None = None
    token_hash: str
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    last_used_at: datetime | None = None


class WalletDocument(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    available_messages: int = 0
    available_sessions: int = 0
    updated_at: datetime

###

class UsageAuthorizeRequest(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    session_id: str
    endpoint: str
    trace_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class UsageCheckResponse(BaseModel):
    usage_log_id: str
    status: UsageLogStatus
    resource_type: ResourceType
    committed_units: int = 0
    idempotent_replay: bool = False


class UsageFinalizeRequest(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    session_id: str = ""
    endpoint: str = ""
    trace_id: str | None = None
    billing_model: BillingModel | str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class UsageFailedRequest(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    session_id: str = ""
    endpoint: str = ""
    trace_id: str | None = None
    billing_model: BillingModel | str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    error_code: str | None = None
    error_message: str | None = None


class UsageFinalizeResponse(BaseModel):
    usage_log_id: str
    status: UsageLogStatus
    committed_units: int
    idempotent_replay: bool = False


class CreditAccountRequest(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    idempotency_key: str
    resource_type: ResourceType
    purchased_units: int = Field(gt=0)
    # external_payment_id: str
    # amount: float = Field(ge=0)
    # currency: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreditAccountResponse(BaseModel):
    payment_id: str
    user_id: str | None = None
    organization_id: str | None = None
    status: PaymentStatus
    resource_type: ResourceType
    purchased_units: int
    available_messages: int
    available_sessions: int
    idempotent_replay: bool = False


class CreateOrganizationApiKeyRequest(BaseModel):
    name: str | None = Field(default=None, max_length=100)


class OrganizationApiKeyView(BaseModel):
    id: str
    organization_id: str
    name: str | None = None
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None
    last_used_at: datetime | None = None


class CreateOrganizationApiKeyResponse(BaseModel):
    api_key: str
    token_type: str = "Bearer"
    key: OrganizationApiKeyView


class OrganizationApiKeysPageView(BaseModel):
    items: list[OrganizationApiKeyView] = Field(default_factory=list)
    page: int
    page_size: int
    total: int


class UsageTokenOwner(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None


class WalletView(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    available_messages: int
    available_sessions: int
    updated_at: datetime | None = None

class PricingDecision(BaseModel):
    billing_model: BillingModel
    resource_type: ResourceType
    units: int


class UsageLogsPageView(BaseModel):
    items: list[UsageLogRequestDocument] = Field(default_factory=list)
    page: int
    page_size: int
    total: int


class PaymentInfoPageView(BaseModel):
    items: list[PaymentInfoDocument] = Field(default_factory=list)
    page: int
    page_size: int
    total: int

class DailyUsagePoint(BaseModel):
    date: str
    count: int = 0


class UsageDashboardView(BaseModel):
    user_id: str | None = None
    organization_id: str | None = None
    wallet: WalletView
    total_messages_bought: int = 0
    today_count: int = 0
    month_count: int = 0
    month_start: datetime
    month_end: datetime
    daily_usage: list[DailyUsagePoint] = Field(default_factory=list)
