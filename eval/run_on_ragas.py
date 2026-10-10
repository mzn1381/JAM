import json
from pathlib import Path

from datasets import Dataset
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas import evaluate
from ragas.embeddings import LangchainEmbeddingsWrapper
from ragas.llms import LangchainLLMWrapper
from ragas.metrics import (
    Faithfulness,
    ContextPrecision,
    ContextRecall,
    AnswerRelevancy,
)
from ragas.run_config import RunConfig


BASE_DIR = (
    Path(__file__).resolve().parent
    if "__file__" in globals()
    else Path.cwd()
)

DATASET_PATH = BASE_DIR / "ragas_dataset.jsonl"
OUTPUT_PATH = BASE_DIR / "ragas_results2.json"


def load_dataset():
    if not DATASET_PATH.is_file():
        raise FileNotFoundError(f"Dataset file not found: {DATASET_PATH}")

    rows = []

    with DATASET_PATH.open("r", encoding="utf-8-sig") as f:
        for line_number, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            try:
                row = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSON at line {line_number}: {exc}"
                ) from exc

            if not isinstance(row, dict):
                raise ValueError(
                    f"Dataset line {line_number} must contain a JSON object."
                )

            rows.append(row)

    if not rows:
        raise ValueError("Dataset is empty.")

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

    print(f"Model: {llm_model}")
    print(f"Base URL: {llm_base_url}")

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

    print(f"Model: {embedding_model}")
    print(f"Base URL: {embedding_base_url}")

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

    run_config = RunConfig(
        timeout=300,
        max_retries=3,
        max_workers=2,
    )

    print("\nInitializing Judge LLM...")

    llm_client = ChatOpenAI(
        model=llm_model,
        api_key=llm_api_key,
        base_url=llm_base_url,
        temperature=0,
        timeout=300,
        max_retries=2,
    )

    evaluator_llm = LangchainLLMWrapper(
        llm_client,
        run_config=run_config,
    )

    print("\nInitializing Embedding Model...")

    embedding_client = OpenAIEmbeddings(
        model=embedding_model,
        api_key=embedding_api_key,
        base_url=embedding_base_url,
        check_embedding_ctx_length=False,
        request_timeout=120,
        max_retries=3,
    )

    evaluator_embeddings = LangchainEmbeddingsWrapper(
        embedding_client,
        run_config=run_config,
    )

    metrics = [
        Faithfulness(
            llm=evaluator_llm,
        ),
        ContextPrecision(
            llm=evaluator_llm,
        ),
        ContextRecall(
            llm=evaluator_llm,
        ),
        AnswerRelevancy(
            llm=evaluator_llm,
            embeddings=evaluator_embeddings,
            strictness=1,
        ),
    ]

    print("\nMetrics:")
    for metric in metrics:
        print(f"  {type(metric).__name__}")

    print(f"\nEvaluating {len(dataset)} dataset rows...")

    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=evaluator_llm,
        embeddings=evaluator_embeddings,
        run_config=run_config,
        raise_exceptions=False,
        show_progress=True,
    )

    print("\n" + "=" * 60)
    print("Evaluation finished")
    print("=" * 60)
    print(result)

    results_df = result.to_pandas()

    # Serialize missing values and NaN scores as valid JSON null values.
    results_json = results_df.to_json(
        orient="records",
        force_ascii=False,
        indent=2,
    )

    OUTPUT_PATH.write_text(results_json, encoding="utf-8")

    print(f"\nSaved: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()