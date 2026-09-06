from pathlib import Path

from app.chat.llm_client import LLMClient
from app.chat.logger import get_logger
from app.chat.utils.faq_data import DEFAULT_FAQ_FILE, FAQEntry
from app.chat.utils.faq_text_retriever import FAQTextRetriever
from app.chat.utils.faq_vector_store import FAQVectorStore

logger = get_logger("faq_retriever")


class FAQRetriever:
    def __init__(self, llm: LLMClient, csv_path: Path = DEFAULT_FAQ_FILE):
        self._llm = llm
        self._csv_path = csv_path
        self._vector_store: FAQVectorStore | None = None
        self._text_fallback = FAQTextRetriever(csv_path=csv_path)
        self._index_attempted = False
        self._vector_ready = False

    def _ensure_vector_store(self) -> bool:
        if self._vector_ready:
            return True
        if self._index_attempted and self._vector_store is None:
            return False

        self._index_attempted = True
        try:
            store = FAQVectorStore(llm=self._llm, csv_path=self._csv_path)
            if store.ensure_index() and store.is_ready():
                self._vector_store = store
                self._vector_ready = True
                logger.info("FAQ vector retriever is ready")
                return True

            logger.warning("FAQ vector index is not available")
            self._vector_store = None
            return False
        except Exception as exc:
            logger.error(f"FAQ vector store initialization failed: {exc}")
            self._vector_store = None
            return False

    def retrieve(self, query: str, top_k: int = 3) -> list[FAQEntry]:
        if self._ensure_vector_store() and self._vector_store is not None:
            try:
                results = self._vector_store.query(query_text=query, top_k=top_k)
                if results:
                    return results
            except Exception as exc:
                logger.warning(f"FAQ vector query failed, using text fallback: {exc}")

        logger.info("Using FAQ text fallback retriever")
        return self._text_fallback.retrieve(query, top_k=top_k)

    def rebuild_index(self) -> None:
        store = FAQVectorStore(llm=self._llm, csv_path=self._csv_path)
        store.rebuild()
        self._vector_store = store
        self._vector_ready = store.is_ready()
        self._index_attempted = True


_retriever: FAQRetriever | None = None


def init_faq_retriever(llm: LLMClient) -> FAQRetriever:
    global _retriever
    logger.info("Registering FAQ retriever (lazy vector index)")
    _retriever = FAQRetriever(llm=llm)
    return _retriever


def get_faq_retriever() -> FAQRetriever:
    if _retriever is None:
        raise RuntimeError(
            "FAQ retriever is not initialized. Call init_faq_retriever() during startup."
        )
    return _retriever
