from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.identity.domain.enums import MembershipRole, OrganizationStatus, UserStatus


# ---------- Documents (persisted entities) ----------


class UserDocument(BaseModel):
    id: str
    email: str
    phone_number: str | None = None
    full_name: str | None = None
    password_hash: str
    password_salt: str
    status: UserStatus = UserStatus.ACTIVE
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class OrganizationDocument(BaseModel):
    id: str
    slug: str
    name: str
    status: OrganizationStatus = OrganizationStatus.ACTIVE
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class MembershipDocument(BaseModel):
    organization_id: str
    user_id: str
    role: MembershipRole
    created_at: datetime
    updated_at: datetime


class AuthTokenDocument(BaseModel):
    token_hash: str
    user_id: str
    created_at: datetime
    expires_at: datetime


# ---------- Public views (no secrets) ----------


class UserView(BaseModel):
    id: str
    phone_number: str
    email: str  | None
    full_name: str | None = None
    status: UserStatus
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class OrganizationView(BaseModel):
    id: str
    slug: str
    name: str
    status: OrganizationStatus
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class MembershipView(BaseModel):
    organization_id: str
    user_id: str
    role: MembershipRole
    created_at: datetime
    updated_at: datetime


# ---------- User requests ----------


class CreateUserRequest(BaseModel):
    email: str | None = Field(min_length=3)
    phone_number: str = Field(min_length=11)
    password: str = Field(min_length=6)
    full_name: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class UpdateUserRequest(BaseModel):
    full_name: str | None = None
    password: str | None = Field(default=None, min_length=6)
    status: UserStatus | None = None
    metadata: dict[str, Any] | None = None


# ---------- Organization requests ----------


class CreateOrganizationRequest(BaseModel):
    slug: str = Field(min_length=2, max_length=64)
    name: str = Field(min_length=1)
    owner_user_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class UpdateOrganizationRequest(BaseModel):
    name: str | None = None
    status: OrganizationStatus | None = None
    metadata: dict[str, Any] | None = None


# ---------- Membership requests ----------


class AddMemberRequest(BaseModel):
    user_id: str
    role: MembershipRole = MembershipRole.MEMBER


class UpdateMemberRoleRequest(BaseModel):
    role: MembershipRole


# ---------- Auth ----------


class LoginRequest(BaseModel):
    user_name: str = Field(min_length=11)
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    user: UserView


class GuestSessionResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    guest_user_id: str


class IdentityTokenResolution(BaseModel):
    user: UserView
    is_guest: bool = False


class MeResponse(BaseModel):
    user: UserView
    organizations: list[OrganizationView] = Field(default_factory=list)
    memberships: list[MembershipView] = Field(default_factory=list)


class UsersPageView(BaseModel):
    items: list[UserView] = Field(default_factory=list)
    page: int
    page_size: int
    total: int


class OrganizationsPageView(BaseModel):
    items: list[OrganizationView] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
