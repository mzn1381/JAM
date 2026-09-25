


import hashlib
import hmac
import json
import time
import requests
import os


SECRET = os.getenv("CHATWOOT_WEBHOOK_SECRET", "LXZJmTdgLPWbhs7xVwoCqu3X")  # must match CHATWOOT_WEBHOOK_SECRET
URL = "http://localhost:8085/webhook"

payload = {
    "event": "message_created",
    "message_type": "incoming",
    "content": "هوش مصنوعی را توضیح بده",
    "conversation": {"id": 22},
}

raw_body = json.dumps(payload).encode("utf-8")
timestamp = str(int(time.time()))

message = timestamp.encode("utf-8") + b"." + raw_body
signature = "sha256=" + hmac.new(SECRET.encode(), message, hashlib.sha256).hexdigest()

response = requests.post(
    URL,
    data=raw_body,
    headers={
        "Content-Type": "application/json",
        "X-Chatwoot-Timestamp": timestamp,
        "X-Chatwoot-Signature": signature,
    },
)

print(response.status_code, response.json())


