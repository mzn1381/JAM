import json
import re
from pathlib import Path

rows = json.loads(Path("results.json").read_text(encoding="utf-8"))
review = []

for row in rows:
    answer = row.get("answer") or ""
    chunks = (row.get("reference") or {}).get("chunks") or []
    cited_ids = sorted({
        int(n) for n in re.findall(r"\[ID:\s*(\d+)\]", answer)
    })

    item = {
        key: row.get(key)
        for key in (
            "scenario_id", "turn_id", "goal", "question",
            "reference_answer", "evidence_lines", "session_id",
            "status", "answer", "latency_seconds"
        )
    }
    item["cited_chunks"] = [
        {
            "citation_id": i,
            "document_name": chunks[i].get("document_name"),
            "content": chunks[i].get("content"),
        }
        for i in cited_ids if i < len(chunks)
    ]
    review.append(item)

Path("review.json").write_text(
    json.dumps(review, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print("Created review.json")