import random

from app.chat.models.models import GraphState
from app.chat.logger import get_logger

logger = get_logger("greeting")

_GREETING_MESSAGES = [
    "سلام! خوش اومدی. امروز دوست داری کمکت کنم با چی کار کنی؟",
    "درود! من پیشکار هستم. بگو از کجا شروع کنیم؟",
    "سلام بر تو! خوشحالم که پیام دادی. چه کاری برات انجام بدم؟",
    "سلام! آماده‌ام کمکت کنم. نوبت پزشکی، استعلام، یا هر چیز دیگه‌ای مدنظرته؟",
    "درود بر شما! خوش اومدی به پیشکار. چطور می‌تونم کمکت کنم؟",
    "سلام! خوبی؟ اگر کاری داری بگو تا باهم انجامش بدیم.",
    "سلام عزیز! من اینجام تا کمکت کنم. دوست داری از چی شروع کنیم؟",
    "سلام! من پیشکارم و کنارت هستم. بگو چی لازم داری.",
    "سلام! آماده‌ام هر سوال یا درخواستی داری جواب بدم.",
]


def greeting_node(state: GraphState, llm=None) -> GraphState:
    state.final_response = random.choice(_GREETING_MESSAGES)
    logger.info(f"Greeting response: {state.final_response}")
    return state
