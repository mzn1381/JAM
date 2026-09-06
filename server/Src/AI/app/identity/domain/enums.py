from enum import Enum


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    GUEST = "GUEST"
    DISABLED = "DISABLED"


class OrganizationStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"


class MembershipRole(str, Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
