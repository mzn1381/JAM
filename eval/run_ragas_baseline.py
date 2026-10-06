import asyncio
import json
import os
import statistics
import time
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

DATASET_FILE = ROOT / "datasets" / "ragas_dataset.jsonl"
RESULTS_FILE = ROOT / "ragas_results.jsonl"
SUMMARY_FILE = ROOT / "ragas_summary.json"


def load_dataset():
    if not DATASET_FILE.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATASET_FILE}"
        )

    records = []

    with DATASET_FILE.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise RuntimeError(
                    f"Invalid JSON on line {line_no}: {exc}"
                ) from exc

    if not records:
        raise RuntimeError("Dataset is empty.")

    return records


def build_evaluator():
    load_dotenv()

    api_key = os.getenv("RAGAS_API_KEY")
    base_url = os.getenv("RAGAS_BASE_URL")
    model = os.getenv("RAGAS_MODEL")

    if not api_key:
        raise RuntimeError("RAGAS_API_KEY is not set.")

    if not base_url:
        raise RuntimeError("RAGAS_BASE_URL is not set.")

    if not model:
        raise RuntimeError("RAGAS_MODEL is not set.")

    client = AsyncOpenAI(
        api_key=api_key,
        base_url=base_url,
    )

    llm = llm_factory(
        model,
        provider="openai",
        client=client,
    )

    return llm, model


def safe_float(value):
    if value is None:
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


async def evaluate_record(
    record,
    context_precision,
    context_recall,
    faithfulness,
):
    start = time.perf_counter()

    result = {
        "id": record["id"],
        "scenario_id": record["scenario_id"],
        "turn_id": record["turn_id"],
        "user_input": record["user_input"],
        "response": record["response"],
        "reference": record["reference"],
        "num_contexts": len(record.get("retrieved_contexts", [])),
        "context_precision": None,
        "context_recall": None,
        "faithfulness": None,
        "error": None,
    }

    try:
        cp = await context_precision.ascore(
            user_input=record["user_input"],
            retrieved_contexts=record["retrieved_contexts"],
            reference=record["reference"],
        )

        result["context_precision"] = safe_float(cp.value)

        cr = await context_recall.ascore(
            user_input=record["user_input"],
            retrieved_contexts=record["retrieved_contexts"],
            reference=record["reference"],
        )

        result["context_recall"] = safe_float(cr.value)

        faith = await faithfulness.ascore(
            user_input=record["user_input"],
            response=record["response"],
            retrieved_contexts=record["retrieved_contexts"],
        )

        result["faithfulness"] = safe_float(
            faith.value
        )

    except Exception as exc:
        result["error"] = (
            f"{type(exc).__name__}: {exc}"
        )

    result["evaluation_latency_seconds"] = round(
        time.perf_counter() - start,
        4
    )

    return result


def summarize(results, evaluator_model):
    metric_names = [
        "context_precision",
        "context_recall",
        "faithfulness",
    ]

    summary = {
        "ragas_version": "0.4.3",
        "evaluator_model": evaluator_model,
        "dataset_file": str(DATASET_FILE),
        "total_records": len(results),
        "successful_records": sum(
            r["error"] is None
            for r in results
        ),
        "failed_records": sum(
            r["error"] is not None
            for r in results
        ),
        "metrics": {},
    }

    for metric in metric_names:
        values = [
            r[metric]
            for r in results
            if r[metric] is not None
        ]

        if not values:
            summary["metrics"][metric] = {
                "count": 0,
                "mean": None,
                "median": None,
                "min": None,
                "max": None,
            }
            continue

        summary["metrics"][metric] = {
            "count": len(values),
            "mean": round(statistics.mean(values), 6),
            "median": round(statistics.median(values), 6),
            "min": round(min(values), 6),
            "max": round(max(values), 6),
        }

    return summary


async def main():
    print("========================================")
    print("        iChAt RAGAS Baseline")
    print("========================================")

    records = load_dataset()

    print(f"Dataset records: {len(records)}")

    evaluator_llm, evaluator_model = build_evaluator()

    context_precision = ContextPrecision(
        llm=evaluator_llm
    )

    context_recall = ContextRecall(
        llm=evaluator_llm
    )

    faithfulness = Faithfulness(
        llm=evaluator_llm
    )

    results = []

    for index, record in enumerate(records, start=1):

        print()
        print(
            f"[{index}/{len(records)}] "
            f"{record['id']}"
        )

        print(
            f"Question: {record['user_input']}"
        )

        result = await evaluate_record(
            record=record,
            context_precision=context_precision,
            context_recall=context_recall,
            faithfulness=faithfulness,
        )

        if result["error"]:
            print(
                f"ERROR: {result['error']}"
            )
        else:
            print(
                "Context Precision:",
                result["context_precision"]
            )
            print(
                "Context Recall:",
                result["context_recall"]
            )
            print(
                "Faithfulness:",
                result["faithfulness"]
            )

        results.append(result)

    # -----------------------------
    # Save per-record results
    # -----------------------------

    with RESULTS_FILE.open(
        "w",
        encoding="utf-8"
    ) as f:

        for result in results:
            f.write(
                json.dumps(
                    result,
                    ensure_ascii=False
                ) + "\n"
            )

    # -----------------------------
    # Save summary
    # -----------------------------

    summary = summarize(
        results,
        evaluator_model
    )

    with SUMMARY_FILE.open(
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            summary,
            f,
            ensure_ascii=False,
            indent=2
        )

    # -----------------------------
    # Print final summary
    # -----------------------------

    print()
    print("========================================")
    print("             FINAL SUMMARY")
    print("========================================")

    print(
        f"Records: {summary['total_records']}"
    )

    print(
        f"Successful: {summary['successful_records']}"
    )

    print(
        f"Failed: {summary['failed_records']}"
    )

    for metric, values in summary["metrics"].items():

        print()
        print(metric)

        print(
            f"  Mean   : {values['mean']}"
        )

        print(
            f"  Median : {values['median']}"
        )

        print(
            f"  Min    : {values['min']}"
        )

        print(
            f"  Max    : {values['max']}"
        )

    print()
    print(f"Results: {RESULTS_FILE}")
    print(f"Summary: {SUMMARY_FILE}")


if __name__ == "__main__":
    asyncio.run(main())