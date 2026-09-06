import os
import time

from dotenv import load_dotenv
from fastapi import APIRouter
from fastapi import HTTPException
from fastapi import Request
from fastapi import Response

from app.chat.handler import ChatHandler
from app.chat.logger import get_logger, get_trace_id
from app.chat.models.models import ChatDataResponse, ChatRequest, ResponseType, GraphResult
from app.core.response_model import ApiResponse
from app.identity import get_auth_service
from app.identity.domain.errors import IdentityError
from app.routers.identity_common import extract_bearer
from app.usage import get_organization_api_key_service, get_usage_service
from app.usage.domain.errors import UsageError
from app.usage.models import (
    UsageAuthorizeRequest,
    UsageFailedRequest,
    UsageFinalizeRequest,
    UsageTokenOwner,
)
from app.observability.logging.exception_logging import log_exception


logger = get_logger("rest_endpoints")
router = APIRouter()

_handler: ChatHandler | None = None


def _get_handler() -> ChatHandler:
    global _handler
    if _handler is not None:
        return _handler

    load_dotenv()
    base_url = os.getenv("BASE_URL")
    if not base_url:
        raise RuntimeError("BASE_URL is not set")

    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        raise RuntimeError("LLM_API_KEY is not set")

    llm_model = os.getenv("LLM_MODEL")
    if not llm_model:
        raise RuntimeError("LLM_MODEL is not set")

    _handler = ChatHandler(base_url=base_url, api_key=api_key, model=llm_model)

    return _handler


def _resolve_usage_owner(payload: ChatRequest, request: Request) -> UsageTokenOwner:
    authorization = request.headers.get("Authorization")

    usage_billing_enabled = os.getenv("USAGE_BILLING_ENABLED", "false").lower() == "true"
    if not usage_billing_enabled:
        return UsageTokenOwner(user_id="anonymous")

    token = extract_bearer(authorization)
    try:
        user = get_auth_service().resolve_token(token)
        return UsageTokenOwner(user_id=user.id)
    except IdentityError:
        pass

    try:
        guest_user_id = get_auth_service().resolve_guest_user_id(token)
        return UsageTokenOwner(user_id=guest_user_id)
    except IdentityError:
        pass

    try:
        organization_id = get_organization_api_key_service().resolve_token_owner(token)
        return UsageTokenOwner(organization_id=organization_id)
    except UsageError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Authorization token",
        ) from exc


def _has_single_usage_owner(user_id: str | None, organization_id: str | None) -> bool:
    return bool(user_id) != bool(organization_id)


@router.post("/api/v2/Chat", response_model=ApiResponse[ChatDataResponse])
async def chat_endpoint(
    payload: ChatRequest, request: Request, response: Response
) -> ApiResponse[ChatDataResponse]:
    trace_id = get_trace_id()

    if not payload.tasks:
        return ApiResponse.fail(
            message="No tasks provided",
            error_code=1,
            data=ChatDataResponse(tools=[]),
        )

    session_id = payload.tasks[-1].chatId
    user_message = payload.tasks[-1].message
    owner = _resolve_usage_owner(payload, request)
    user_id = owner.user_id
    organization_id = owner.organization_id

    started = time.perf_counter()
    try:
        get_usage_service().check_credit(
            UsageAuthorizeRequest(
                user_id=user_id,
                organization_id=organization_id,
                session_id=session_id,
                endpoint="/api/v2/Chat",
                trace_id=trace_id,
            )
        )

        handler = _get_handler()
        chatHandlerResult = handler.chat(user_message, session_id)
        final_response = chatHandlerResult.final_response
        tool_result = chatHandlerResult.tool_result

        if chatHandlerResult.success:
            get_usage_service().process_usage(
                UsageFinalizeRequest(
                    user_id=user_id,
                    organization_id=organization_id,
                    session_id=session_id,
                    endpoint="/api/v2/Chat",
                    trace_id=trace_id,
                )
            )
    except UsageError as exc:
        logger.exception("Usage billing failed")
        await log_exception(request, exc)
        if _has_single_usage_owner(user_id, organization_id):
            get_usage_service().log_failed(
                UsageFailedRequest(
                    user_id=user_id,
                    organization_id=organization_id,
                    session_id=session_id,
                    endpoint="/api/v2/Chat",
                    trace_id=trace_id,
                    error_code=getattr(exc, "code", "USAGE_ERROR"),
                    error_message=str(exc),
                )
            )
        return ApiResponse.fail(
            message=str(exc),
            error_code=4,
            data=ChatDataResponse(tools=[]),
        )
    except Exception as exc:
        logger.exception("Chat endpoint failed")
        await log_exception(request, exc)
        if _has_single_usage_owner(user_id, organization_id):
            get_usage_service().log_failed(
                UsageFailedRequest(
                    user_id=user_id,
                    organization_id=organization_id,
                    session_id=session_id,
                    endpoint="/api/v2/Chat",
                    trace_id=trace_id,
                    # billing_model=billing_model,
                    error_code=str(getattr(exc, "code", "CHAT_FAILURE")),
                    error_message=str(exc),
                )
            )
        return ApiResponse.fail(
            message=str(exc),
            error_code=2,
            data=ChatDataResponse(tools=[]),
        )
    finally:
        duration_ms = int((time.perf_counter() - started) * 1000)

    tool = GraphResult(
        toolType=tool_result.toolType if tool_result else ResponseType.TEXT,
        text=tool_result.text if tool_result else final_response,
        otpPayload=tool_result.otpPayload if tool_result else None,
        ondevicePayload=tool_result.ondevicePayload if tool_result else None,
        listOptionsPayload=tool_result.listOptionsPayload if tool_result else None,
        confirmationPayload=tool_result.confirmationPayload if tool_result else None,
        cardViewPayload=tool_result.cardViewPayload if tool_result else None,
    )

    return ApiResponse.ok(
        data=ChatDataResponse(
            tools=[tool]
        ),
        message="OK",
    )
