import os
from typing import Protocol

from app.chat.llm_client import LLMClient
from app.chat.logger import get_logger

logger = get_logger("embedding_service")

LOCAL_EMBED_MODEL = os.getenv(
    "FAQ_LOCAL_EMBED_MODEL",
    "intfloat/multilingual-e5-small",
)


class Embedder(Protocol):
    def embed(self, text: str) -> list[float]: ...

    def embed_batch(self, texts: list[str]) -> list[list[float]]: ...


class ApiEmbedder:
    def __init__(self, llm: LLMClient):
        self._llm = llm
        self.provider = "api"

    def embed(self, text: str) -> list[float]:
        return self._llm.embed(text)

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return self._llm.embed_batch(texts)


class LocalEmbedder:
    def __init__(self):
        from fastembed import TextEmbedding

        logger.info(f"Loading local embedding model: {LOCAL_EMBED_MODEL}")
        self._model = TextEmbedding(model_name=LOCAL_EMBED_MODEL)
        self.provider = "local"

    def embed(self, text: str) -> list[float]:
        vector = next(self._model.embed([f"query: {text}"]))
        return vector.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        prefixed = [f"passage: {text}" for text in texts]
        return [vector.tolist() for vector in self._model.embed(prefixed)]


class EmbeddingService:
    """Try Metis API first; fall back to local model for FAQ vectors."""

    def __init__(self, llm: LLMClient):
        self._api = ApiEmbedder(llm)
        self._local_embedder: LocalEmbedder | None = None
        self.active_provider = "api"

    def _get_local(self) -> LocalEmbedder:
        if self._local_embedder is None:
            self._local_embedder = LocalEmbedder()
        return self._local_embedder

    def use_provider(self, provider: str) -> None:
        if provider in {"api", "local"}:
            self.active_provider = provider

    def embed_batch(self, texts: list[str], *, force_provider: str | None = None) -> list[list[float]]:
        provider = force_provider or self.active_provider
        if provider == "local":
            vectors = self._get_local().embed_batch(texts)
            self.active_provider = "local"
            return vectors

        try:
            vectors = self._api.embed_batch(texts)
            self.active_provider = "api"
            return vectors
        except Exception as exc:
            logger.warning(f"API embedding failed, falling back to local model: {exc}")
            vectors = self._get_local().embed_batch(texts)
            self.active_provider = "local"
            return vectors

    def embed(self, text: str, *, force_provider: str | None = None) -> list[float]:
        provider = force_provider or self.active_provider
        if provider == "local":
            vector = self._get_local().embed(text)
            self.active_provider = "local"
            return vector

        try:
            vector = self._api.embed(text)
            self.active_provider = "api"
            return vector
        except Exception as exc:
            logger.warning(f"API embedding failed, falling back to local model: {exc}")
            vector = self._get_local().embed(text)
            self.active_provider = "local"
            return vector
