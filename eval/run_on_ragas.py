import json
import os
from pathlib import Path
from getpass import getpass

from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    Faithfulness,
    ContextPrecision,
    ContextRecall,
    AnswerRelevancy,
)
# from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI
# from ragas.embeddings import embedding_factory 
from ragas.embeddings.base import embedding_factory 
from openai import OpenAI
from ragas.llms import llm_factory

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "ragas_dataset.jsonl"
# OUTPUT_PATH = BASE_DIR / "ragas_results.json"
OUTPUT_PATH = BASE_DIR / "ragas_results2.json"


def load_dataset():
    rows = []

    with DATASET_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if line:
                rows.append(json.loads(line))

    return Dataset.from_list(rows)


def get_config():
    print("=" * 60)
    print("RAGAS Configuration")
    print("=" * 60)

    print("\n--- Judge LLM ---")

    llm_api_key = "sk-unsloth-f78779061e4c57dbfe93eae9e0b677c2"

    llm_base_url = "http://172.16.1.172:8888/v1"

    llm_model = "unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF"

    if not llm_api_key:
        raise ValueError("LLM API Key cannot be empty.")

    if not llm_base_url:
        raise ValueError("LLM Base URL cannot be empty.")

    if not llm_model:
        raise ValueError("LLM Model Name cannot be empty.")

    print("\n--- Embedding Model ---")

    embedding_api_key = "aa-T66Faylc66mbOm8DNIIb7XOQZpLZHuGS3fYPJ1DfffXEYdB4"
    embedding_base_url = "https://api.avalai.ir/v1"

    embedding_model = "text-embedding-3-small"

    if not embedding_api_key:
        raise ValueError("Embedding API Key cannot be empty.")

    if not embedding_base_url:
        raise ValueError("Embedding Base URL cannot be empty.")

    if not embedding_model:
        raise ValueError("Embedding Model Name cannot be empty.")

    return (
        llm_api_key,
        llm_base_url,
        llm_model,
        embedding_api_key,
        embedding_base_url,
        embedding_model,
    )
def main():
    dataset = load_dataset()

    print(f"\nDataset rows: {len(dataset)}")

    (
    llm_api_key,
    llm_base_url,
    llm_model,
    embedding_api_key,
    embedding_base_url,
    embedding_model,
    ) = get_config()

    print("\nInitializing Judge LLM...")

    llm_client = OpenAI(
    api_key=llm_api_key,
    base_url=llm_base_url,
)

    evaluator_llm = llm_factory(
    llm_model,
    client=llm_client,
)

    embedding_client = OpenAI(
    api_key=embedding_api_key,
    base_url=embedding_base_url,
)

    evaluator_embeddings = embedding_factory(
    "openai",
    model=embedding_model,
    client=embedding_client,
)
    metrics = [
    Faithfulness(llm=evaluator_llm),
    ContextPrecision(llm=evaluator_llm),
    ContextRecall(llm=evaluator_llm),
    AnswerRelevancy(
        llm=evaluator_llm,
        embeddings=evaluator_embeddings,
    ),
]

    print("\nMetrics:")
    for metric in metrics:
        print(f"  {type(metric).__name__}")

    result = evaluate(
        dataset=dataset,
        metrics=metrics,
    )

    print("\n" + "=" * 60)
    print("Evaluation finished")
    print("=" * 60)

    print(result)

    result_dict = result.to_pandas().to_dict(orient="records")

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(
            result_dict,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\nSaved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()