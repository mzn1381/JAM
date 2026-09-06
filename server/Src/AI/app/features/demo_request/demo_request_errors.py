class DemoRequestError(Exception):
    code = "DEMO_REQUEST_ERROR"


class DemoRequestConfigurationError(DemoRequestError):
    code = "CONFIGURATION_ERROR"


class DemoRequestAlreadyExistsError(DemoRequestError):
    code = "DEMO_REQUEST_ALREADY_EXISTS"
