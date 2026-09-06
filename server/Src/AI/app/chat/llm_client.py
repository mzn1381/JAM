import json
import os
from typing import TypeVar

from openai import OpenAI
from langchain.chat_models import init_chat_model
from pydantic import BaseModel

from app.chat.utils.prompts import FARSI_OUTPUT_RULE
from app.chat.models.models import SlotFillerLLMStructuredOutput

StructuredOutputT = TypeVar("StructuredOutputT", bound=BaseModel)

_PERSIAN_SYSTEM_PREFIX = (
    "You are a Persian-language (فارسی) intelligent assistant. "
    "All responses and generated text shown to the user must be in Persian only.\n\n"
)


class LLMClient:
    def __init__(self, base_url: str, api_key: str, model: str):
        # Keep OpenAI client only for embeddings
        self.embedding_client = OpenAI(
            api_key=api_key,
            base_url=base_url,
        )
        self.model = model
        self.embedding_model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

        # Use init_chat_model for all chat operations
        self.chat_model = init_chat_model(
            model=self.model,
            model_provider="openai",
            api_key=api_key,
            base_url=base_url,
        )

    def embed(self, text: str) -> list[float]:
        response = self.embedding_client.embeddings.create(
            model=self.embedding_model,
            input=text,
        )
        return response.data[0].embedding

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self.embedding_client.embeddings.create(
            model=self.embedding_model,
            input=texts,
        )
        return [item.embedding for item in response.data]

    def _system_prompt(self, prompt: str) -> str:
        return f"{_PERSIAN_SYSTEM_PREFIX}{prompt.strip()}\n\n{FARSI_OUTPUT_RULE.strip()}"

    def complete_structured_output(
        self,
        system_prompt: str,
        messages: list[dict],
        output_schema: type[StructuredOutputT],
    ) -> StructuredOutputT:
        structured_model = self.chat_model.with_structured_output(output_schema, include_raw=True)

        response = structured_model.invoke(
            [
                {
                    "role": "system",
                    "content": self._system_prompt(system_prompt),
                },
                *messages,
            ]
        )

        parsed = response["parsed"]

        if parsed is not None:
            return parsed

        parsing_error = response["parsing_error"]
        raw = response["raw"]

        raise ValueError(
            f"Failed to parse structured output for {output_schema.__name__}. "
            f"Error: {parsing_error}. "
            f"Raw response: {raw.content!r}"
        )

    def complete(self, system_prompt: str, messages: list[dict]) -> str:
        response = self.chat_model.invoke(
            [{"role": "system", "content": self._system_prompt(system_prompt)}, *messages]
        )
        return response.content

    def complete_slotfiller_structured(self, system_prompt: str, messages: list[dict]) -> SlotFillerLLMStructuredOutput:
        return self.complete_structured_output(
            system_prompt,
            messages,
            SlotFillerLLMStructuredOutput,
        )
