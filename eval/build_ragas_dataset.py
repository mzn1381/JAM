import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent

ANSWERS_FILE = ROOT / "answers_review.json"
DIGEST_FILE = ROOT / "digest_summary.jsonl"

OUTPUT_DIR = ROOT / "datasets"
OUTPUT_FILE = OUTPUT_DIR / "ragas_dataset.jsonl"


def load_answers():
    with ANSWERS_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        (item["scenario_id"], item["turn_id"]): item
        for item in data
    }


def load_digest():
    records = {}

    with DIGEST_FILE.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):

            line = line.strip()

            if not line:
                continue

            item = json.loads(line)

            key = (
                item["scenario_id"],
                item["turn_id"],
            )

            records[key] = item

    return records


def main():

    answers = load_answers()
    digest = load_digest()

    print(f"answers_review records: {len(answers)}")
    print(f"digest_summary records: {len(digest)}")

    answer_keys = set(answers.keys())
    digest_keys = set(digest.keys())

    missing_in_digest = answer_keys - digest_keys
    extra_in_digest = digest_keys - answer_keys

    if missing_in_digest:
        raise RuntimeError(
            f"Missing digest records: {sorted(missing_in_digest)}"
        )

    if extra_in_digest:
        print(
            "Warning: extra digest records:",
            sorted(extra_in_digest)
        )

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    count = 0

    with OUTPUT_FILE.open("w", encoding="utf-8") as out:

        for key in sorted(answer_keys):

            answer_item = answers[key]
            digest_item = digest[key]

            top_chunks = digest_item.get("top_chunks", [])

            retrieved_contexts = [
                chunk["text"]
                for chunk in top_chunks
                if chunk.get("text")
            ]

            retrieved_context_ids = [
                chunk["chunk_id"]
                for chunk in top_chunks
                if chunk.get("chunk_id")
            ]

            retrieval_scores = [
                chunk.get("similarity")
                for chunk in top_chunks
            ]

            record = {
                "id": (
                    f'{answer_item["scenario_id"]}'
                    f'-T{answer_item["turn_id"]}'
                ),

                "scenario_id": answer_item["scenario_id"],
                "turn_id": answer_item["turn_id"],

                "user_input": answer_item["question"],

                "response": digest_item["answer"],

                "reference": answer_item["reference_answer"],

                "retrieved_contexts": retrieved_contexts,

                "retrieved_context_ids": retrieved_context_ids,

                "retrieval_scores": retrieval_scores,

                "metadata": {
                    "goal": answer_item.get("goal"),
                    "evidence_lines": answer_item.get(
                        "evidence_lines"
                    ),
                    "status": answer_item.get("status"),
                    "http_status": answer_item.get(
                        "http_status"
                    ),
                    "latency_seconds": answer_item.get(
                        "latency_seconds"
                    ),
                },
            }

            out.write(
                json.dumps(
                    record,
                    ensure_ascii=False
                ) + "\n"
            )

            count += 1

    print("\nDataset created successfully.")
    print(f"Records written: {count}")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()