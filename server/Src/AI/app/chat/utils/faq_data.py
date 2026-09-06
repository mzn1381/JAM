import csv
from dataclasses import dataclass
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"
DEFAULT_FAQ_FILE = KNOWLEDGE_DIR / "faq_questions_answers_paziresh24.csv"


@dataclass
class FAQEntry:
    question: str
    answer: str
    score: float = 0.0


def load_faq_entries(csv_path: Path = DEFAULT_FAQ_FILE) -> list[tuple[str, str]]:
    if not csv_path.exists():
        return []

    entries: list[tuple[str, str]] = []
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row.get("questions", "").strip()
            answer = row.get("answers", "").strip()
            if question and answer:
                entries.append((question, answer))
    return entries
