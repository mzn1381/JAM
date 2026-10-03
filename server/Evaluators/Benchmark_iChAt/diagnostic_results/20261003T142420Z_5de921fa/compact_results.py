import json
from pathlib import Path

root = Path(__file__).resolve().parent
rows = json.loads(
    (root / "results.json").read_text(encoding="utf-8-sig")
)

compact = [
    {
        "scenario_id": row["scenario_id"],
        "turn_id": row["turn_id"],
        "question": row["question"],
        "answer": row.get("answer"),
        "reference_answer": row.get("reference_answer"),
        "evidence_lines": row.get("evidence_lines"),
        "status": row.get("status"),
        "latency_seconds": row.get("latency_seconds"),
        "error": row.get("error"),
    }
    for row in rows
]

target = root / "answers_review.json"
target.write_text(
    json.dumps(compact, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"Saved {len(compact)} answers: {target}")