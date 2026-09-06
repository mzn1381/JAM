from difflib import SequenceMatcher
from pathlib import Path

from app.chat.utils.faq_data import DEFAULT_FAQ_FILE, FAQEntry, load_faq_entries
from app.chat.utils.text_normalizer import normalize_text


class FAQTextRetriever:
    """Fallback retriever when vector embeddings are unavailable."""

    def __init__(self, csv_path: Path = DEFAULT_FAQ_FILE):
        self._entries = load_faq_entries(csv_path)

    def _score(self, query: str, question: str) -> float:
        normalized_query = normalize_text(query)
        normalized_question = normalize_text(question)
        sequence_score = SequenceMatcher(None, normalized_query, normalized_question).ratio()

        query_tokens = set(normalized_query.split())
        question_tokens = set(normalized_question.split())
        if not query_tokens:
            overlap_score = 0.0
        else:
            overlap_score = len(query_tokens & question_tokens) / len(query_tokens)

        substring_bonus = (
            0.1
            if normalized_query in normalized_question or normalized_question in normalized_query
            else 0.0
        )
        return 0.5 * sequence_score + 0.4 * overlap_score + substring_bonus

    def retrieve(self, query: str, top_k: int = 3) -> list[FAQEntry]:
        scored = [
            FAQEntry(question=question, answer=answer, score=self._score(query, question))
            for question, answer in self._entries
        ]
        scored.sort(key=lambda entry: entry.score, reverse=True)
        return scored[:top_k]
