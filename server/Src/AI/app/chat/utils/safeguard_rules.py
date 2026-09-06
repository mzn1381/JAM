import re

from app.chat.utils.text_normalizer import normalize_text

# سوالات اطلاعاتی درباره اورژانس — نباید block شوند (به FAQ می‌روند)
_FAQ_EMERGENCY_PATTERNS = (
    r"آیا.*اورژانس",
    r"چه\s*شرایطی.*اورژانس",
    r"شرایط\s*اورژانس.*چ",
    r"اورژانس.*مناسب",
    r"برای\s*شرایط\s*اورژانس",
    r"اورژانس.*چیست",
    r"اورژانس.*چیه",
    r"ویزیت\s*آنلاین.*اورژانس",
)

# علائم یا درخواست کمک فوری — باید block شوند
_EMERGENCY_SYMPTOM_PATTERNS = (
    r"درد\s*شدید\s*قفسه\s*سینه",
    r"تنگی\s*نفس\s*شدید",
    r"نفس\s*نمی\s*کشم",
    r"نمی\s*تونم\s*نفس\s*بکشم",
    r"بیهوش\s*شد",
    r"دارم\s*بیهوش",
    r"خونریزی\s*شدید",
    r"خون\s*زیاد\s*می\s*ریز",
    r"تشنج\s*کرد",
    r"تشنج\s*دارم",
    r"علائم\s*سکته",
    r"سکته\s*دارم",
    r"سکته\s*کرد",
    r"سکته\s*مغزی",
    r"سکته\s*قلبی",
    r"حمله\s*قلبی",
    r"سوختگی\s*شدید",
    r"ضعف\s*ناگهانی",
    r"بی\s*حسی\s*ناگهانی",
    r"کاهش\s*هوشیاری",
    r"هوشیاری\s*ندار",
    r"117\s*بگیر",
    r"اورژانس\s*ببر",
    r"اورژانس\s*تماس",
    r"فورا\s*به\s*اورژانس",
    r"فوری\s*کمک",
    r"الان\s*اورژانس",
)

_CRISIS_PATTERNS = (
    r"می\s*خوام\s*بمیر",
    r"می\s*خواهم\s*بمیر",
    r"خودکشی",
    r"جان\s*خود\s*را\s*بگیر",
    r"دیگه\s*نمی\s*خوام\s*زنده\s*بمون",
)

_EMERGENCY_RESPONSE = (
    "به نظر می‌رسد ممکن است با یک وضعیت فوری یا اورژانسی مواجه باشید. "
    "پذیرش۲۴ برای رزرو نوبت و خدمات برنامه‌ریزی‌شده است و جایگزین اورژانس نیست.\n\n"
    "لطفاً فوراً با **۱۱۵** (اورژانس) تماس بگیرید یا به نزدیک‌ترین مرکز درمانی مراجعه کنید."
)

_CRISIS_RESPONSE = (
    "متوجه شدم که ممکن است در وضعیت سختی باشید. "
    "من فقط یک دستیار نوبت‌دهی هستم و نمی‌توانم در این شرایط کمک تخصصی بدهم.\n\n"
    "لطفاً همین الان با **۱۲۳** (خط مشاوره و بحران) یا **۱۱۵** (اورژانس) تماس بگیرید "
    "یا به نزدیک‌ترین فرد مورد اعتماد خود مراجعه کنید."
)


def _prepare_for_match(text: str) -> str:
    normalized = normalize_text(text)
    return normalized.replace("\u200c", " ").strip()


def _matches_any(text: str, patterns: tuple[str, ...]) -> bool:
    return any(re.search(pattern, text) for pattern in patterns)


def _is_faq_about_emergency(text: str) -> bool:
    return _matches_any(text, _FAQ_EMERGENCY_PATTERNS)


def check_safeguard(text: str) -> tuple[bool, str, str]:
    """
    Returns (blocked, reason, response_message).
    reason: 'emergency' | 'crisis' | ''
    """
    normalized = _prepare_for_match(text)
    if not normalized:
        return False, "", ""

    if _matches_any(normalized, _CRISIS_PATTERNS):
        return True, "crisis", _CRISIS_RESPONSE

    if _is_faq_about_emergency(normalized):
        return False, "", ""

    if _matches_any(normalized, _EMERGENCY_SYMPTOM_PATTERNS):
        return True, "emergency", _EMERGENCY_RESPONSE

    return False, "", ""
