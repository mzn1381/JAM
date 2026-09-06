"""Quick connectivity check for Metis API (chat + embeddings)."""

import os
import sys

from dotenv import load_dotenv

from app.chat.llm_client import LLMClient
from app.chat.utils.api_errors import format_api_error


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

    print("Checking chat completion...")
    try:
        reply = llm.complete("You are a test bot. Reply with OK only.", [{"role": "user", "content": "ping"}])
        print(f"chat OK: {reply[:80]!r}")
    except Exception as exc:
        print(f"chat FAILED: {format_api_error(exc)}", file=sys.stderr)
        return 2

    print("Checking embeddings...")
    try:
        vector = llm.embed("test embedding")
        print(f"embed OK: dims={len(vector)}")
    except Exception as exc:
        print(f"embed FAILED: {format_api_error(exc)}", file=sys.stderr)
        return 3

    print("All API checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
