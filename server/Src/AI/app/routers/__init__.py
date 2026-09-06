from .chat_endpoints import router as chat_router
from .logs_endpoints import router as logs_router
from .usage_endpoints import router as usage_router
from .identity_endpoints import router as identity_router
from .user_endpoints import router as user_router
from .organization_endpoints import router as organization_router
from .organization_api_key_endpoints import router as organization_api_key_router
from .health_endpoints import router as health_router
from .demo_request_endpoints import router as demo_request_router
from .transcription_endpoints import router as transcription_router
from .ticket_endpoints import router as ticket_router

all_routers = [
    health_router,
    chat_router,
    transcription_router,
    logs_router,
    usage_router,
    identity_router,
    user_router,
    organization_router,
    organization_api_key_router,
    demo_request_router,
    ticket_router,
]
