import os
from dotenv import load_dotenv
from app.chat.handler import ChatHandler

load_dotenv()

# base_url = os.getenv("BASE_URL")
# if not base_url:
#     raise RuntimeError("BASE_URL is not set")

# api_key = os.getenv("LLM_API_KEY")
# if not api_key:
#     raise RuntimeError("LLM_API_KEY is not set")

# llm_model = os.getenv("LLM_MODEL")
# if not llm_model:
#     raise RuntimeError("LLM_MODEL is not set")

# handler = ChatHandler(
#     base_url=base_url,
#     api_key=api_key,
#     model=llm_model
# )

handler = ChatHandler(
    base_url="https://api.avalai.ir/v1",
    api_key="aa-kXbFuouhiEH9d49dpB1jX6htMTbdpLKx1z1lNgfN5Fpn229a",
    model="gpt-4o-mini"
)

# session_id = None
session_id = "550e8400-e29b-41d4-a716-446655440000"


def chat_turn(message: str,sess_id: str=""):
    global session_id
    print(f"\nUser: {message}")
    response = handler.chat(message, session_id)
    print(f"Bot: {response}")

# ######
# chat_turn("سلام")
# print("--------------------------------")
# chat_turn("میخوام یه آلارم تنظیم کنم")
# print("--------------------------------")
# chat_turn("ساعت ۶ صبح یکشنبه")
# print("--------------------------------")
# chat_turn("من میخوام از کدپستی خونم رو ببینم")
# print("--------------------------------")
# chat_turn("پام پیچ خورده، یه دکتر برای معاینه تو قم پیدا کن")
# print("--------------------------------")
chat_turn("می خوام تو آراد ثبت نام کنم")
print("--------------------------------")
chat_turn("آب")
print("--------------------------------")
# chat_turn("من چجوری میتونم نوبت دکترمو لغو کنم")
# print("--------------------------------")
# chat_turn("می‌خوام برای این هفته یه دکتر پیدا کنم")
# print("--------------------------------")
chat_turn("برام دکتر پیدا کن")
print("--------------------------------")
chat_turn("اصفهان")
# print("--------------------------------")
chat_turn("عمومی")