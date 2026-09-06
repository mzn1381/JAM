"""Build or rebuild the Paziresh24 FAQ vector index from CSV."""

import os
import sys

from dotenv import load_dotenv

from app.chat.llm_client import LLMClient
from app.chat.utils.faq_retriever import init_faq_retriever


def main() -> int:
    load_dotenv()
    base_url = os.environ.get("BASE_URL")
    api_key = os.environ.get("LLM_API_KEY")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    if not base_url:
        print("BASE_URL is not set", file=sys.stderr)
        return 1
    if not api_key:
        print("LLM_API_KEY is not set", file=sys.stderr)
        return 1

    llm = LLMClient(base_url=base_url, api_key=api_key, model=model)
    retriever = init_faq_retriever(llm)
    retriever.rebuild_index()
    print("FAQ vector index rebuilt successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
