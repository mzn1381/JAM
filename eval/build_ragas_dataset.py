import json
from pathlib import Path


# آخرین خروجی Benchmark
RESULTS_PATH = Path("ragflow_benchmark_results") / "20261007_151350_5c1e08" / "results.jsonl"

# خروجی Dataset برای RAGAS
OUTPUT_PATH = Path("ragas_dataset.jsonl")


def main():
    rows = []

    with RESULTS_PATH.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if not line:
                continue

            record = json.loads(line)

            item = {
                "question": record["question"],
                "answer": record["answer"],
                "contexts": record["retrieved_contexts"],
                "reference": record["reference_answer"],
            }

            rows.append(item)

    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        for item in rows:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

    print(f"Created: {OUTPUT_PATH}")
    print(f"Total records: {len(rows)}")

    if rows:
        print("\nFirst record:")
        print(json.dumps(rows[0], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()