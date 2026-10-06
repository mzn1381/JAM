import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI

from ragas.llms import llm_factory
from ragas.metrics.collections import (
    ContextPrecision,
    ContextRecall,
    Faithfulness,
)


ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "datasets" / "ragas_dataset.jsonl"


async def main():

    load_dotenv()

    # ---------------------------------
    # 1. Load D01
    # ---------------------------------

    d01 = None

    with DATASET.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line:
                continue

            item = json.loads(line)

            if item["id"] == "D01-T1":
                d01 = item
                break

    if d01 is None:
        raise RuntimeError("D01-T1 not found")

    print("========== D01 ==========")
    print("Question:")
    print(d01["user_input"])

    print("\nResponse:")
    print(d01["response"])

    print("\nReference:")
    print(d01["reference"])

    print(
        f"\nRetrieved contexts: "
        f"{len(d01['retrieved_contexts'])}"
    )

    # ---------------------------------
    # 2. Evaluator LLM
    # ---------------------------------

    api_key = os.getenv("RAGAS_API_KEY")
    base_url = os.getenv("RAGAS_BASE_URL")
    model = os.getenv("RAGAS_MODEL")

    if not api_key:
        raise RuntimeError("RAGAS_API_KEY is not set")

    if not base_url:
        raise RuntimeError("RAGAS_BASE_URL is not set")

    if not model:
        raise RuntimeError("RAGAS_MODEL is not set")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    evaluator_llm = llm_factory(
        model,
        provider="openai",
        client=client,
    )

    # ---------------------------------
    # 3. Metrics
    # ---------------------------------

    context_precision = ContextPrecision(
        llm=evaluator_llm
    )

    context_recall = ContextRecall(
        llm=evaluator_llm
    )

    faithfulness = Faithfulness(
        llm=evaluator_llm
    )

    # ---------------------------------
    # 4. Evaluate
    # ---------------------------------

    print("\nRunning Context Precision...")

    cp = await context_precision.ascore(
        user_input=d01["user_input"],
        retrieved_contexts=d01["retrieved_contexts"],
        reference=d01["reference"],
    )

    print("Running Context Recall...")

    cr = await context_recall.ascore(
        user_input=d01["user_input"],
        retrieved_contexts=d01["retrieved_contexts"],
        reference=d01["reference"],
    )

    print("Running Faithfulness...")

    faith = await faithfulness.ascore(
        user_input=d01["user_input"],
        response=d01["response"],
        retrieved_contexts=d01["retrieved_contexts"],
    )

    # ---------------------------------
    # 5. Results
    # ---------------------------------

    print("\n========== RAGAS RESULT ==========")

    print(
        f"Context Precision : {cp.value:.4f}"
    )

    print(
        f"Context Recall    : {cr.value:.4f}"
    )

    print(
        f"Faithfulness      : {faith.value:.4f}"
    )


if __name__ == "__main__":
    asyncio.run(main())