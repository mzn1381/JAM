_PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"
_EN_DIGITS = "0123456789"

_DIGIT_MAP = str.maketrans(_PERSIAN_DIGITS + _ARABIC_DIGITS, _EN_DIGITS * 2)

_CHAR_MAP = {
    "ي": "ی",
    "ى": "ی",
    "ك": "ک",
    "ة": "ه",
    "ۀ": "ه",
    "أ": "ا",
    "إ": "ا",
    "آ": "ا",
    "ؤ": "و",
    "ئ": "ی",
    "‌": "\u200c",
}


def normalize_text(text: str) -> str:
    """Normalize Persian/Arabic text for downstream NLP and slot filling."""
    if not text:
        return text

    normalized = text.translate(_DIGIT_MAP)
    for src, dst in _CHAR_MAP.items():
        normalized = normalized.replace(src, dst)

    normalized = " ".join(normalized.split())
    return normalized.strip()
