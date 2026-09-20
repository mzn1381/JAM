#!/usr/bin/env python3
"""
Minimal Chatwoot Agent Bot
Python 3.11+
Standard library only.

Authentication:
  1. Webhook Secret authenticates incoming Chatwoot -> Bot requests.
  2. Agent Bot Access Token authenticates Bot -> Chatwoot API requests.
"""

import hashlib
import hmac
import json
import logging
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


HOST = os.getenv("BOT_HOST", "0.0.0.0")
PORT = int(os.getenv("BOT_PORT", "5000"))

CHATWOOT_URL = os.getenv("CHATWOOT_URL", "http://172.16.1.81:3000").rstrip("/")
CHATWOOT_ACCOUNT_ID = os.getenv("CHATWOOT_ACCOUNT_ID", "")
CHATWOOT_ACCESS_TOKEN = os.getenv("CHATWOOT_ACCESS_TOKEN", "")

# Secret generated for the Agent Bot's webhook.
CHATWOOT_WEBHOOK_SECRET = os.getenv("CHATWOOT_WEBHOOK_SECRET", "")
VERIFY_SIGNATURE = os.getenv("VERIFY_SIGNATURE", "true").lower() == "true"
MAX_TIMESTAMP_AGE = int(os.getenv("MAX_TIMESTAMP_AGE", "300"))

BOT_REPLY = os.getenv("BOT_REPLY", "رسید")


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("chatwoot-bot")


def verify_chatwoot_signature(
    raw_body: bytes,
    timestamp: str,
    received_signature: str,
) -> bool:
    """
    Verify the Agent Bot webhook using the Webhook Secret.

    Chatwoot signature format:
        sha256=HMAC_SHA256(secret, "{timestamp}.{raw_body}")
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


def send_chatwoot_message(conversation_id: int, content: str) -> None:
    """
    Send an outgoing message using the Agent Bot Access Token.

    Chatwoot's Agent Bot token is intentionally used here rather than
    an administrator's personal API token.
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

    payload = json.dumps(
        {
            "content": content,
            "message_type": "outgoing",
            "private": False,
            "content_type": "text",
            "content_attributes": {},
        },
        ensure_ascii=False,
    ).encode("utf-8")

    request = Request(
        url,
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            # Agent Bot access-token header.
            "api-access-token": CHATWOOT_ACCESS_TOKEN,
        },
    )

    try:
        with urlopen(request, timeout=15) as response:
            response_body = response.read().decode("utf-8", errors="replace")

            logger.info(
                "Chatwoot reply sent | conversation_id=%s | status=%s | response=%s",
                conversation_id,
                response.status,
                response_body[:500],
            )

    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.error(
            "Chatwoot API error | status=%s | body=%s",
            exc.code,
            body[:1000],
        )
        raise

    except URLError as exc:
        logger.error("Could not reach Chatwoot API: %s", exc)
        raise


def extract_message(payload: dict):
    """
    Extract fields from an Agent Bot message_created payload.

    Current Chatwoot Agent Bot webhook payload places:
      event
      message_type
      content
      conversation.id

    Returns:
      event, conversation_id, message_type, content
    """
    event = payload.get("event")
    message_type = payload.get("message_type")
    content = payload.get("content")

    conversation = payload.get("conversation") or {}
    conversation_id = conversation.get("id")

    return event, conversation_id, message_type, content


class ChatwootHandler(BaseHTTPRequestHandler):
    server_version = "ChatwootPythonBot/1.1"

    def _send_json(self, status: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")

        self.send_response(status)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8",
        )
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        if path == "/health":
            self._send_json(
                200,
                {
                    "status": "ok",
                    "service": "chatwoot-python-bot",
                    "webhook_signature_verification": VERIFY_SIGNATURE,
                },
            )
            return

        self._send_json(404, {"error": "not_found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path

        if path != "/webhook":
            self._send_json(404, {"error": "not_found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(length)

            # Authenticate Chatwoot -> Bot.
            if VERIFY_SIGNATURE:
                signature = self.headers.get(
                    "X-Chatwoot-Signature",
                    "",
                )
                timestamp = self.headers.get(
                    "X-Chatwoot-Timestamp",
                    "",
                )

                if not verify_chatwoot_signature(
                    raw_body,
                    timestamp,
                    signature,
                ):
                    logger.warning(
                        "Rejected Chatwoot webhook: invalid signature."
                    )
                    self._send_json(
                        401,
                        {"error": "invalid_signature"},
                    )
                    return

            payload = json.loads(
                raw_body.decode("utf-8")
            )

            event, conversation_id, message_type, content = (
                extract_message(payload)
            )

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
                self._send_json(
                    200,
                    {
                        "status": "ignored",
                        "reason": "event",
                    },
                )
                return

            # Ignore our own outgoing messages.
            # This prevents an infinite Bot -> Chatwoot -> Bot loop.
            if message_type != "incoming":
                self._send_json(
                    200,
                    {
                        "status": "ignored",
                        "reason": "not_incoming",
                    },
                )
                return

            if conversation_id is None:
                logger.error(
                    "No conversation_id in Chatwoot payload."
                )
                self._send_json(
                    400,
                    {"error": "missing_conversation_id"},
                )
                return

            # Test response.
            send_chatwoot_message(
                int(conversation_id),
                BOT_REPLY,
            )

            self._send_json(
                200,
                {
                    "status": "ok",
                    "conversation_id": conversation_id,
                },
            )

        except json.JSONDecodeError:
            logger.exception("Invalid JSON payload.")
            self._send_json(
                400,
                {"error": "invalid_json"},
            )

        except Exception as exc:
            logger.exception(
                "Webhook processing failed: %s",
                exc,
            )
            self._send_json(
                500,
                {"error": "internal_error"},
            )

    def log_message(self, format: str, *args) -> None:
        logger.info("HTTP | " + format, *args)


def main() -> None:
    logger.info("Starting Chatwoot Python Bot")
    logger.info("Listening on %s:%s", HOST, PORT)
    logger.info(
        "Webhook: http://<server>:%s/webhook",
        PORT,
    )
    logger.info(
        "Health:  http://<server>:%s/health",
        PORT,
    )
    logger.info("Chatwoot URL: %s", CHATWOOT_URL)
    logger.info(
        "Webhook signature verification: %s",
        VERIFY_SIGNATURE,
    )

    if not CHATWOOT_ACCOUNT_ID:
        logger.warning(
            "CHATWOOT_ACCOUNT_ID is not configured."
        )

    if not CHATWOOT_ACCESS_TOKEN:
        logger.warning(
            "CHATWOOT_ACCESS_TOKEN is not configured."
        )

    if VERIFY_SIGNATURE and not CHATWOOT_WEBHOOK_SECRET:
        logger.warning(
            "VERIFY_SIGNATURE=true but "
            "CHATWOOT_WEBHOOK_SECRET is not configured."
        )

    server = ThreadingHTTPServer(
        (HOST, PORT),
        ChatwootHandler,
    )

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
