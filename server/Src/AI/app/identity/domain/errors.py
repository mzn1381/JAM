class IdentityError(Exception):
    code = "IDENTITY_ERROR"


class ConfigurationError(IdentityError):
    code = "CONFIGURATION_ERROR"


class UserNotFoundError(IdentityError):
    code = "USER_NOT_FOUND"


class UserAlreadyExistsError(IdentityError):
    code = "USER_ALREADY_EXISTS"


class OrganizationNotFoundError(IdentityError):
    code = "ORGANIZATION_NOT_FOUND"


class OrganizationAlreadyExistsError(IdentityError):
    code = "ORGANIZATION_ALREADY_EXISTS"


class MembershipNotFoundError(IdentityError):
    code = "MEMBERSHIP_NOT_FOUND"


class MembershipAlreadyExistsError(IdentityError):
    code = "MEMBERSHIP_ALREADY_EXISTS"


class InvalidCredentialsError(IdentityError):
    code = "INVALID_CREDENTIALS"


class InvalidTokenError(IdentityError):
    code = "INVALID_TOKEN"
