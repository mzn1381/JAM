from datetime import datetime

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator


class TicketDocument(BaseModel):
    id: str
    full_name: str
    subject: str
    email: str
    phone_number: str
    organization_name: str | None = None
    content_text: str
    created_at: datetime
    updated_at: datetime


class CreateTicketRequest(BaseModel):
    full_name: str = Field(
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices(
            "Fullname",
            "FullName",
            "fullName",
            "fullname",
            "full_name",
        ),
    )
    subject: str = Field(
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices("Subject", "subject"),
    )
    email: str = Field(
        min_length=3,
        max_length=100,
        validation_alias=AliasChoices("Email", "email"),
    )
    phone_number: str = Field(
        min_length=7,
        max_length=20,
        validation_alias=AliasChoices(
            "PhoneNumber",
            "phoneNumber",
            "phonenumber",
            "phone_number",
        ),
    )
    organization_name: str | None = Field(
        default=None,
        max_length=150,
        validation_alias=AliasChoices(
            "OrganizationName",
            "organizationName",
            "organizationname",
            "organization_name",
        ),
    )
    content_text: str = Field(
        min_length=1,
        max_length=1000,
        validation_alias=AliasChoices(
            "ContentText",
            "contentText",
            "content_text",
            "Content",
            "content",
        ),
    )

    model_config = ConfigDict(populate_by_name=True)

    @field_validator(
        "full_name",
        "subject",
        "email",
        "phone_number",
        "content_text",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return str(value).strip()

    @field_validator("organization_name", mode="before")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.rsplit("@", 1)[-1]:
            raise ValueError("Invalid email address")
        return normalized


class TicketView(BaseModel):
    id: str
    full_name: str
    subject: str
    email: str
    phone_number: str
    organization_name: str | None = None
    content_text: str
    created_at: datetime
    updated_at: datetime


class TicketsPageView(BaseModel):
    items: list[TicketView] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
