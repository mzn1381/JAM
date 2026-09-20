import hashlib
import hmac
import json
import logging
import os
import time
import uuid

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel

from app.chat.handler import ChatHandler


# --------------------------------------------------
# Environment
# --------------------------------------------------
load_dotenv()


CHATWOOT_URL = os.getenv("CHATWOOT_URL", "http://172.16.1.81:3000").rstrip("/")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "")
CHATWOOT_ACCESS_TOKEN = os.getenv("CHATWOOT_ACCESS_TOKEN", "")

# Secret generated for the Agent Bot's webhook.
CHATWOOT_WEBHOOK_SECRET = os.getenv("CHATWOOT_WEBHOOK_SECRET", "")
# VERIFY_SIGNATURE = os.getenv("VERIFY_SIGNATURE", "true").lower() == "true" #MGZ
VERIFY_SIGNATURE = os.getenv("VERIFY_SIGNATURE", "true").lower() == "true"
MAX_TIMESTAMP_AGE = int(os.getenv("MAX_TIMESTAMP_AGE", "300"))




# --------------------------------------------------
# Logging
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("chat-api")


# --------------------------------------------------
# FastAPI app
# --------------------------------------------------

app = FastAPI(
    title="Chat API",
    version="1.0.0",
)


# --------------------------------------------------
# Chat Handler (single shared instance, reused by
# both /chat and the Chatwoot /webhook endpoint)
# --------------------------------------------------

handler = ChatHandler(
    base_url=os.getenv("BASE_URL", "https://api.avalai.ir/v1"),
    api_key=os.getenv("LLM_API_KEY", "aa-kXbFuouhiEH9d49dpB1jX6htMTbdpLKx1z1lNgfN5Fpn229a"),
    model=os.getenv("LLM_MODEL", "gpt-oss-120b"),
)


# --------------------------------------------------
# Chatwoot configuration
# --------------------------------------------------

CHATWOOT_URL = os.getenv("CHATWOOT_URL", "http://172.16.1.81:3000").rstrip("/")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "")
CHATWOOT_ACCESS_TOKEN = os.getenv("CHATWOOT_ACCESS_TOKEN", "")

# Secret generated for the Agent Bot's webhook (used to verify Chatwoot -> Bot requests)
CHATWOOT_WEBHOOK_SECRET = os.getenv("CHATWOOT_WEBHOOK_SECRET", "")
VERIFY_SIGNATURE = os.getenv("VERIFY_SIGNATURE", "true").lower() == "true"
MAX_TIMESTAMP_AGE = int(os.getenv("MAX_TIMESTAMP_AGE", "300"))


# --------------------------------------------------
# Request / Response Models
# --------------------------------------------------

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    response: str


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "webhook_signature_verification": VERIFY_SIGNATURE,
    }


# --------------------------------------------------
# Chat Endpoint (unchanged, existing functionality preserved)
# --------------------------------------------------

# @app.post("/chat", response_model=ChatResponse)
@app.post("/chat")
def chat(request: ChatRequest):

    try:
        # اگر session_id ارسال نشده باشد، یک session جدید ایجاد می‌کنیم
        session_id = request.session_id or str(uuid.uuid4())

        response = handler.chat(
            request.message,
            session_id
        )
        print("response  ", response)
        return ChatResponse(
            session_id=session_id,
            response=response.final_response
        )
        # return response.final_response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# --------------------------------------------------
# Chatwoot Webhook Integration
# --------------------------------------------------
#
# Chatwoot -> Bot authentication:
#   HMAC-SHA256 signature verification using CHATWOOT_WEBHOOK_SECRET.
#   Signature format: sha256=HMAC_SHA256(secret, "{timestamp}.{raw_body}")
#
# Bot -> Chatwoot authentication:
#   Agent Bot Access Token sent as the "api-access-token" header.
# --------------------------------------------------

def verify_chatwoot_signature(
    raw_body: bytes,
    timestamp: str,
    received_signature: str,
) -> bool:
    """
    Verify the Agent Bot webhook using the Webhook Secret.
    """
    if not CHATWOOT_WEBHOOK_SECRET:
        logger.error("CHATWOOT_WEBHOOK_SECRET is not configured.")
        return False

    if not timestamp or not received_signature:
        logger.warning("Missing Chatwoot webhook signature headers.")
        return False

    try:
        ts = int(timestamp)
    except ValueError:
        logger.warning("Invalid X-Chatwoot-Timestamp.")
        return False

    if abs(int(time.time()) - ts) > MAX_TIMESTAMP_AGE:
        logger.warning("Rejected webhook: timestamp is too old.")
        return False

    message = timestamp.encode("utf-8") + b"." + raw_body

    digest = hmac.new(
        CHATWOOT_WEBHOOK_SECRET.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    expected = "sha256=" + digest
    return hmac.compare_digest(expected, received_signature)


def extract_message(payload: dict):
    """
    Extract fields from an Agent Bot message_created payload.

    Returns:
      event, conversation_id, message_type, content
    """
    event = payload.get("event")
    message_type = payload.get("message_type")
    content = payload.get("content")

    conversation = payload.get("conversation") or {}
    conversation_id = conversation.get("id")

    return event, conversation_id, message_type, content


def send_chatwoot_message(conversation_id: int, content: str) -> None:
    """
    Send an outgoing message using the Agent Bot Access Token.
    """
    if not CHATWOOT_ACCOUNT_ID:
        raise RuntimeError("CHATWOOT_ACCOUNT_ID is not configured")

    if not CHATWOOT_ACCESS_TOKEN:
        raise RuntimeError("CHATWOOT_ACCESS_TOKEN is not configured")

    url = (
        f"{CHATWOOT_URL}/api/v1/accounts/"
        f"{CHATWOOT_ACCOUNT_ID}/conversations/"
        f"{conversation_id}/messages"
    )

    payload = {
        "content": content,
        "message_type": "outgoing",
        "private": False,
        "content_type": "text",
        "content_attributes": {},
    }

    try:
        response = requests.post(
            url,
            json=payload,
            headers={"api-access-token": CHATWOOT_ACCESS_TOKEN},
            timeout=15,
        )
        response.raise_for_status()

        logger.info(
            "Chatwoot reply sent | conversation_id=%s | status=%s",
            conversation_id,
            response.status_code,
        )

    except requests.RequestException as exc:
        logger.error(
            "Chatwoot API error | conversation_id=%s | error=%s",
            conversation_id,
            exc,
        )
        raise


@app.post("/webhook")
async def chatwoot_webhook(request: Request):
    """
    Chatwoot Agent Bot webhook endpoint.

    Verifies the request signature, extracts the incoming user message,
    forwards it to the existing chat service (`handler.chat`), and sends
    the generated reply back to Chatwoot.
    """
    raw_body = await request.body()

    # --- Authenticate Chatwoot -> Bot ---
    if VERIFY_SIGNATURE:
        signature = request.headers.get("X-Chatwoot-Signature", "")
        timestamp = request.headers.get("X-Chatwoot-Timestamp", "")

        if not verify_chatwoot_signature(raw_body, timestamp, signature):
            logger.warning("Rejected Chatwoot webhook: invalid signature.")
            raise HTTPException(status_code=401, detail="invalid_signature")

    # --- Parse payload ---
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        logger.exception("Invalid JSON payload.")
        raise HTTPException(status_code=400, detail="invalid_json")

    event, conversation_id, message_type, content = extract_message(payload)

    logger.info(
        "Webhook received | event=%s | conversation_id=%s | "
        "message_type=%s | content=%r",
        event,
        conversation_id,
        message_type,
        content,
    )

    # Only process actual message_created events.
    if event != "message_created":
        return {"status": "ignored", "reason": "event"}

    # Ignore our own outgoing messages to prevent Bot -> Chatwoot -> Bot loop.
    if message_type != "incoming":
        return {"status": "ignored", "reason": "not_incoming"}

    if conversation_id is None:
        logger.error("No conversation_id in Chatwoot payload.")
        raise HTTPException(status_code=400, detail="missing_conversation_id")

    if not content:
        logger.warning(
            "Empty/None content in incoming message, ignoring | conversation_id=%s",
            conversation_id,
        )
        return {"status": "ignored", "reason": "empty_content"}

    # --- Reuse the existing chat service ---
    # Map each Chatwoot conversation to a stable session_id so that
    # conversation history/context is preserved across messages.
    session_id = f"chatwoot-{conversation_id}"

    try:
        chat_result = handler.chat(content, session_id)
        reply_text = chat_result.final_response
    except Exception as exc:
        logger.exception(
            "Chat handler failed | conversation_id=%s | error=%s",
            conversation_id,
            exc,
        )
        raise HTTPException(status_code=500, detail="chat_handler_error")

    # --- Send reply back to Chatwoot ---
    try:
        send_chatwoot_message(int(conversation_id), reply_text)
    except Exception as exc:
        logger.exception(
            "Failed to send reply to Chatwoot | conversation_id=%s | error=%s",
            conversation_id,
            exc,
        )
        raise HTTPException(status_code=502, detail="chatwoot_send_failed")

    return {"status": "ok", "conversation_id": conversation_id}