import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.chat.handler import ChatHandler


# --------------------------------------------------
# Environment
# --------------------------------------------------

load_dotenv()


# --------------------------------------------------
# FastAPI app
# --------------------------------------------------

app = FastAPI(
    title="Chat API",
    version="1.0.0",
)


# --------------------------------------------------
# Chat Handler
# --------------------------------------------------

handler = ChatHandler(
    base_url=os.getenv("BASE_URL", "https://api.avalai.ir/v1"),
    api_key=os.getenv("LLM_API_KEY","aa-kXbFuouhiEH9d49dpB1jX6htMTbdpLKx1z1lNgfN5Fpn229a"),
    model=os.getenv("LLM_MODEL", "gpt-oss-120b"),
)


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
        "status": "ok"
    }


# --------------------------------------------------
# Chat Endpoint
# --------------------------------------------------

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    try:
        # اگر session_id ارسال نشده باشد، یک session جدید ایجاد می‌کنیم
        session_id = request.session_id or str(uuid.uuid4())

        response = handler.chat(
            request.message,
            session_id
        )
        print("response  " , response)
        return ChatResponse(
            session_id=session_id,
            response=response.final_response
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )