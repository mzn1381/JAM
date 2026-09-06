from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CompanySize(str, Enum):
    RANGE_0_50 = "0-50"
    RANGE_50_250 = "50-250"
    RANGE_250_1000 = "250-1000"
    RANGE_1000_PLUS = "1000+"


class DemoRequestDocument(BaseModel):
    id: str
    full_name: str
    company_name: str
    company_size: CompanySize
    job_title: str
    phone_number: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class CreateDemoRequestRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=150, alias="Fullname")
    company_name: str = Field(min_length=1, max_length=150, alias="CompanyName")
    company_size: CompanySize = Field(alias="CompanySize")
    job_title: str = Field(min_length=1, max_length=150, alias="JobTitle")
    phone_number: str = Field(min_length=7, max_length=32, alias="PhoneNumber")

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("company_size", mode="before")
    @classmethod
    def normalize_company_size(cls, value):
        if isinstance(value, CompanySize):
            return value
        normalized = str(value).strip()
        aliases = {
            "0": CompanySize.RANGE_0_50,
            "1": CompanySize.RANGE_50_250,
            "2": CompanySize.RANGE_250_1000,
            "3": CompanySize.RANGE_1000_PLUS,
            "0:50": CompanySize.RANGE_0_50,
            "50:250": CompanySize.RANGE_50_250,
            "250:1000": CompanySize.RANGE_250_1000,
            "1000+": CompanySize.RANGE_1000_PLUS,
            "0-50": CompanySize.RANGE_0_50,
            "50-250": CompanySize.RANGE_50_250,
            "250-1000": CompanySize.RANGE_250_1000,
        }
        return aliases.get(normalized, normalized)

    @field_validator("full_name", "company_name", "job_title", "phone_number")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class DemoRequestView(BaseModel):
    id: str
    full_name: str
    company_name: str
    company_size: CompanySize
    job_title: str
    phone_number: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime


class DemoRequestsPageView(BaseModel):
    items: list[DemoRequestView] = Field(default_factory=list)
    page: int
    page_size: int
    total: int
