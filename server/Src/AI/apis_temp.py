import hashlib
import hmac
import json
import logging
import os
import threading
import time
import uuid

import requests
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from pydantic import BaseModel
from starlette.requests import ClientDisconnect

from app.chat.handler import ChatHandler


# --------------------------------------------------
# Environment — بدون تغییر
# --------------------------------------------------

load_dotenv()

CHATWOOT_URL = os.getenv("CHATWOOT_URL", "http://172.16.1.81:3000").rstrip("/")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "1")
CHATWOOT_ACCESS_TOKEN = os.getenv(
    "CHATWOOT_ACCESS_TOKEN",
    "1hgyEiwcnHfRvBp1hchVttaq",
)

CHATWOOT_WEBHOOK_SECRET = os.getenv(
    "CHATWOOT_WEBHOOK_SECRET",
    "LXZJmTdgLPWbhs7xVwoCqu3X",
)
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
# FastAPI
# --------------------------------------------------

app = FastAPI(
    title="Chat API",
    version="1.0.0",
)


# --------------------------------------------------
# Shared Chat Handler — تنظیمات بدون تغییر
# --------------------------------------------------

handler = ChatHandler(
    base_url=os.getenv("BASE_URL", "https://api.avalai.ir/v1"),
    api_key=os.getenv(
        "LLM_API_KEY",
        "aa-kXbFuouhiEH9d49dpB1jX6htMTbdpLKx1z1lNgfN5Fpn229a",
    ),
    model=os.getenv("LLM_MODEL", "gpt-oss-120b"),
)

# هر دو مسیر /chat و /webhook از همین قفل استفاده می‌کنند.
# قفل فقط داخل همین Process از دسترسی هم‌زمان به Handler محافظت می‌کند.
handler_lock = threading.Lock()

# Timeout اتصال و انتظار دریافت داده برای درخواست به Chatwoot.
# Read timeout سقف کل زمان اجرای درخواست نیست.
CHATWOOT_HTTP_TIMEOUT = (5.0, 15.0)

MAX_WEBHOOK_BODY_BYTES = 1024 * 1024

# نکات اجرایی:
# - اگر History در حافظه Handler است، سرویس را با --workers 1 اجرا کنید.
# - BackgroundTasks صف پایدار نیست؛ با توقف Process ممکن است کار از دست برود.
# - این نسخه Deduplication و تضمین ترتیب پیام‌های هم‌زمان ندارد.
# - Timeout و Retry محدود درخواست مدل باید داخل ChatHandler تنظیم شوند.
#   Thread و Lock نمی‌توانند فراخوانی شبکه گیرکرده داخل Handler را قطع کنند.
# - اصلاحات زیر Blocking روی Event Loop را حذف می‌کنند و منابع HTTP ارسال
#   به Chatwoot را می‌بندند؛ رفع همه علل CLOSE_WAIT نیازمند بررسی محیط و Handler است.


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
# Shared Chat Execution
# --------------------------------------------------

def generate_reply(message: str, session_id: str) -> str:
    waiting_started = time.monotonic()

    with handler_lock:
        started = time.monotonic()

        logger.info(
            "Chat processing started | session_id=%s | lock_wait=%.2fs",
            session_id,
            started - waiting_started,
        )

        result = handler.chat(message, session_id)
        reply = getattr(result, "final_response", None)

        if not isinstance(reply, str) or not reply.strip():
            raise ValueError("ChatHandler returned an empty or invalid response")

        logger.info(
            "Chat processing completed | session_id=%s | elapsed=%.2fs",
            session_id,
            time.monotonic() - started,
        )

        return reply


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/health")
async def health():
    # این مسیر به Thread Pool و قفل Handler وابسته نیست.
    # فقط زنده‌بودن API را گزارش می‌کند، نه سلامت مدل یا Chatwoot.
    return {
        "status": "ok",
        "webhook_signature_verification": VERIFY_SIGNATURE,
    }


# --------------------------------------------------
# Chat Endpoint
# --------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # FastAPI مسیر def را در Thread Pool اجرا می‌کند؛
    # فراخوانی Sync مدل در Event Loop اجرا نمی‌شود.
    if not request.message.strip():
        raise HTTPException(status_code=422, detail="empty_message")

    session_id = request.session_id or str(uuid.uuid4())

    if not session_id.strip():
        raise HTTPException(status_code=422, detail="empty_session_id")

    try:
        reply = generate_reply(request.message, session_id)

        return ChatResponse(
            session_id=session_id,
            response=reply,
        )

    except Exception:
        logger.exception(
            "Chat endpoint failed | session_id=%s",
            session_id,
        )
        raise HTTPException(
            status_code=500,
            detail="chat_handler_error",
        ) from None


# --------------------------------------------------
# Chatwoot Signature Verification
# --------------------------------------------------

def verify_chatwoot_signature(
    raw_body: bytes,
    timestamp: str,
    received_signature: str,
) -> bool:
    # قرارداد امضای کد فعلی حفظ شده است:
    # sha256=HMAC_SHA256(secret, timestamp + "." + raw_body)
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
        logger.warning("Rejected webhook: timestamp outside allowed window.")
        return False

    message = timestamp.encode("utf-8") + b"." + raw_body

    digest = hmac.new(
        CHATWOOT_WEBHOOK_SECRET.encode("utf-8"),
        message,
        hashlib.sha256,
    ).hexdigest()

    expected = ("sha256=" + digest).encode("ascii")

    # مقایسه bytes برای رد امن Headerهای غیر ASCII.
    return hmac.compare_digest(
        expected,
        received_signature.encode("utf-8"),
    )


# --------------------------------------------------
# Webhook Body / Payload Validation
# --------------------------------------------------

async def read_webhook_body(request: Request) -> bytes:
    content_length = request.headers.get("content-length")

    if content_length is not None:
        try:
            declared_length = int(content_length)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="invalid_content_length",
            ) from None

        if declared_length < 0:
            raise HTTPException(
                status_code=400,
                detail="invalid_content_length",
            )

        if declared_length > MAX_WEBHOOK_BODY_BYTES:
            raise HTTPException(status_code=413, detail="payload_too_large")

    body = bytearray()

    try:
        # خواندن Body باید await/async باشد؛ request.body() در مسیر def
        # بدون await، داده درخواست را برنمی‌گرداند.
        async for chunk in request.stream():
            if len(body) + len(chunk) > MAX_WEBHOOK_BODY_BYTES:
                raise HTTPException(status_code=413, detail="payload_too_large")

            body.extend(chunk)

    except ClientDisconnect:
        logger.info("Webhook client disconnected while sending request body.")
        raise HTTPException(
            status_code=400,
            detail="client_disconnected",
        ) from None

    return bytes(body)


def parse_conversation_id(value: object) -> int:
    if value is None:
        raise HTTPException(
            status_code=400,
            detail="missing_conversation_id",
        )

    # bool و float نباید به‌صورت ضمنی به شناسه تبدیل شوند.
    if isinstance(value, bool):
        raise HTTPException(status_code=400, detail="invalid_conversation_id")

    if isinstance(value, int):
        conversation_id = value
    elif isinstance(value, str) and value.isascii() and value.isdecimal():
        try:
            conversation_id = int(value)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="invalid_conversation_id",
            ) from None
    else:
        raise HTTPException(status_code=400, detail="invalid_conversation_id")

    if conversation_id <= 0:
        raise HTTPException(status_code=400, detail="invalid_conversation_id")

    return conversation_id


# --------------------------------------------------
# Send Message to Chatwoot
# --------------------------------------------------

def send_chatwoot_message(conversation_id: int, content: str) -> None:
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

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-access-token": CHATWOOT_ACCESS_TOKEN,
    }

    started = time.monotonic()

    # Session مشترک بین Threadها نیست.
    # Response و Session در حالت موفقیت و خطا بسته می‌شوند.
    #
    # Retry خودکار POST عمداً غیرفعال است؛ اگر پیام ثبت شده باشد ولی پاسخ
    # به دست ما نرسد، Retry بدون Idempotency می‌تواند پیام تکراری بسازد.
    with requests.Session() as session:
        with session.post(
            url,
            json=payload,
            headers=headers,
            timeout=CHATWOOT_HTTP_TIMEOUT,
            allow_redirects=False,
            stream=True,
        ) as response:
            response.raise_for_status()

            # raise_for_status پاسخ‌های 3xx را خطا محسوب نمی‌کند.
            if not 200 <= response.status_code < 300:
                raise requests.HTTPError(
                    f"Unexpected Chatwoot status: {response.status_code}",
                    response=response,
                )

            logger.info(
                "Chatwoot reply sent | conversation_id=%s | "
                "status=%s | elapsed=%.2fs",
                conversation_id,
                response.status_code,
                time.monotonic() - started,
            )

            # Body پاسخ استفاده نمی‌شود؛ خروج از with اتصال آن را آزاد می‌کند.


# --------------------------------------------------
# Background Processing
# --------------------------------------------------

def process_chatwoot_message(conversation_id: int, content: str) -> None:
    # این تابع عمداً Sync است؛ Starlette آن را در Thread Pool اجرا می‌کند.
    session_id = f"chatwoot-{conversation_id}"
    started = time.monotonic()

    try:
        reply = generate_reply(content, session_id)
    except Exception:
        logger.exception(
            "Background chat processing failed | conversation_id=%s",
            conversation_id,
        )
        return

    try:
        send_chatwoot_message(conversation_id, reply)
    except Exception:
        logger.exception(
            "Background reply delivery failed | conversation_id=%s",
            conversation_id,
        )
        return

    logger.info(
        "Webhook processing completed | conversation_id=%s | elapsed=%.2fs",
        conversation_id,
        time.monotonic() - started,
    )


# --------------------------------------------------
# Chatwoot Webhook
# --------------------------------------------------

@app.post("/webhook")
async def chatwoot_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    raw_body = await read_webhook_body(request)

    if VERIFY_SIGNATURE:
        signature = request.headers.get("X-Chatwoot-Signature", "")
        timestamp = request.headers.get("X-Chatwoot-Timestamp", "")

        if not verify_chatwoot_signature(raw_body, timestamp, signature):
            logger.warning("Rejected Chatwoot webhook: invalid signature.")
            raise HTTPException(status_code=401, detail="invalid_signature")

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (ValueError, RecursionError):
        raise HTTPException(status_code=400, detail="invalid_json") from None

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="invalid_payload")

    if payload.get("event") != "message_created":
        return {"status": "ignored", "reason": "event"}

    # جلوگیری از حلقه پاسخ به پیام خروجی خود ربات.
    if payload.get("message_type") != "incoming":
        return {"status": "ignored", "reason": "not_incoming"}

    if payload.get("private"):
        return {"status": "ignored", "reason": "private_message"}

    conversation = payload.get("conversation")

    if not isinstance(conversation, dict):
        raise HTTPException(status_code=400, detail="invalid_conversation")

    conversation_id = parse_conversation_id(conversation.get("id"))
    content = payload.get("content")

    if not isinstance(content, str) or not content.strip():
        return {"status": "ignored", "reason": "empty_or_non_text_content"}

    # هیچ فراخوانی Sync مدل یا requests در این مسیر async اجرا نمی‌شود.
    background_tasks.add_task(
        process_chatwoot_message,
        conversation_id,
        content,
    )

    logger.info(
        "Webhook accepted | conversation_id=%s",
        conversation_id,
    )

    # پاسخ 200 پیش از اجرای Background Task ارسال می‌شود.
    # accepted فقط پذیرش پردازش است، نه تضمین تولید یا تحویل پاسخ.
    # خطای Background Task دیگر Status این پاسخ را تغییر نمی‌دهد.
    return {
        "status": "accepted",
        "conversation_id": conversation_id,
    }