import hashlib
import json
import time
from pathlib import Path

import chromadb

from app.chat.llm_client import LLMClient
from app.chat.logger import get_logger
from app.chat.utils.embedding_service import EmbeddingService
from app.chat.utils.faq_data import DEFAULT_FAQ_FILE, FAQEntry, load_faq_entries

logger = get_logger("faq_vector_store")

KNOWLEDGE_DIR = Path(__file__).parent.parent / "knowledge"
VECTOR_DIR = KNOWLEDGE_DIR / "faq_vectors"
INDEX_META_FILE = VECTOR_DIR / "index_meta.json"
COLLECTION_NAME = "paziresh24_faq"
EMBED_BATCH_SIZE = 8
EMBED_MAX_RETRIES = 3


def _csv_fingerprint(csv_path: Path) -> str:
    content = csv_path.read_bytes()
    return hashlib.sha256(content).hexdigest()


def _embedding_document(question: str, answer: str) -> str:
    return f"سوال: {question}\nپاسخ: {answer}"


class FAQVectorStore:
    def __init__(self, llm: LLMClient, csv_path: Path | None = None):
        self.llm = llm
        self.embedder = EmbeddingService(llm)
        self.csv_path = csv_path or DEFAULT_FAQ_FILE
        VECTOR_DIR.mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(path=str(VECTOR_DIR))
        self._collection = self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        self._load_provider_from_meta()

    def _load_provider_from_meta(self) -> None:
        meta = self._read_index_meta()
        if meta and meta.get("embedding_provider") in {"api", "local"}:
            self.embedder.use_provider(meta["embedding_provider"])

    def is_ready(self) -> bool:
        entries = load_faq_entries(self.csv_path)
        if not entries or self._collection.count() == 0:
            return False
        return not self._needs_reindex(len(entries))

    def _read_index_meta(self) -> dict | None:
        if not INDEX_META_FILE.exists():
            return None
        return json.loads(INDEX_META_FILE.read_text(encoding="utf-8"))

    def _write_index_meta(self, meta: dict) -> None:
        INDEX_META_FILE.write_text(
            json.dumps(meta, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _needs_reindex(self, entry_count: int) -> bool:
        fingerprint = _csv_fingerprint(self.csv_path)
        meta = self._read_index_meta()
        if not meta:
            return True

        return (
            meta.get("csv_fingerprint") != fingerprint
            or meta.get("entry_count") != entry_count
            or self._collection.count() != entry_count
        )

    def _embed_batch_with_retry(self, texts: list[str]) -> list[list[float]]:
        last_error: Exception | None = None
        for attempt in range(1, EMBED_MAX_RETRIES + 1):
            try:
                return self.embedder.embed_batch(texts)
            except Exception as exc:
                last_error = exc
                logger.warning(
                    f"Embedding batch failed (attempt {attempt}/{EMBED_MAX_RETRIES}): {exc}"
                )
                if attempt < EMBED_MAX_RETRIES:
                    time.sleep(attempt * 2)
        raise last_error or RuntimeError("Embedding batch failed")

    def _build_index(self, entries: list[tuple[str, str]]) -> None:
        logger.info(
            f"Building FAQ vector index from {self.csv_path} ({len(entries)} entries) "
            f"| provider=api-first"
        )

        existing_ids = self._collection.get(include=[])["ids"]
        if existing_ids:
            self._collection.delete(ids=existing_ids)

        ids: list[str] = []
        documents: list[str] = []
        metadatas: list[dict[str, str]] = []
        embeddings: list[list[float]] = []

        pending_docs: list[str] = []
        pending_ids: list[str] = []
        pending_metas: list[dict[str, str]] = []

        def flush_batch() -> None:
            if not pending_docs:
                return
            batch_embeddings = self._embed_batch_with_retry(pending_docs)
            embeddings.extend(batch_embeddings)
            documents.extend(pending_docs)
            ids.extend(pending_ids)
            metadatas.extend(pending_metas)
            pending_docs.clear()
            pending_ids.clear()
            pending_metas.clear()

        for index, (question, answer) in enumerate(entries):
            doc = _embedding_document(question, answer)
            pending_docs.append(doc)
            pending_ids.append(f"faq-{index}")
            pending_metas.append({"question": question, "answer": answer})

            if len(pending_docs) >= EMBED_BATCH_SIZE:
                flush_batch()

        flush_batch()

        self._collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

        self._write_index_meta(
            {
                "csv_fingerprint": _csv_fingerprint(self.csv_path),
                "entry_count": len(entries),
                "embedding_model": self.llm.embedding_model,
                "embedding_provider": self.embedder.active_provider,
                "local_embed_model": LOCAL_EMBED_MODEL if self.embedder.active_provider == "local" else "",
                "collection": COLLECTION_NAME,
            }
        )
        logger.info(
            f"FAQ vector index build complete | provider={self.embedder.active_provider} | "
            f"entries={len(entries)}"
        )

    def ensure_index(self) -> bool:
        entries = load_faq_entries(self.csv_path)
        if not entries:
            logger.warning(f"No FAQ entries found in {self.csv_path}")
            return False

        if not self._needs_reindex(len(entries)):
            logger.info(
                f"FAQ vector index up to date | entries={len(entries)} | "
                f"collection_count={self._collection.count()} | "
                f"provider={self.embedder.active_provider}"
            )
            return True

        try:
            self._build_index(entries)
            return True
        except Exception as exc:
            logger.error(f"FAQ vector index build failed: {exc}")
            return False

    def query(self, query_text: str, top_k: int = 3) -> list[FAQEntry]:
        if self._collection.count() == 0:
            return []

        query_embedding = self.embedder.embed(query_text)
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self._collection.count()),
            include=["metadatas", "distances"],
        )

        entries: list[FAQEntry] = []
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for metadata, distance in zip(metadatas, distances):
            question = metadata.get("question", "")
            answer = metadata.get("answer", "")
            if not question or not answer:
                continue
            score = max(0.0, 1.0 - float(distance))
            entries.append(FAQEntry(question=question, answer=answer, score=score))

        return entries

    def rebuild(self) -> None:
        entries = load_faq_entries(self.csv_path)
        self._build_index(entries)


# re-export for meta logging
from app.chat.utils.embedding_service import LOCAL_EMBED_MODEL  # noqa: E402
