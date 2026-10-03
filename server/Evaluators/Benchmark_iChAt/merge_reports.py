import json
from pathlib import Path

root = Path("ambiguity_results")
output = Path("combined_reports.json")

if not root.is_dir():
    raise SystemExit(f"Report directory not found: {root.resolve()}")

bundle = {
    "schema_version": 1,
    "runs": [],
}

for group in ("baseline", "patched"):
    group_dir = root / group

    if not group_dir.is_dir():
        print(f"Warning: missing directory: {group_dir}")
        continue

    for run_dir in sorted(group_dir.iterdir()):
        if not run_dir.is_dir():
            continue

        run = {
            "group": group,
            "run_id": run_dir.name,
            "reports": {},
        }

        for filename in (
            "results.json",
            "summary.json",
            "session_events.jsonl",
        ):
            path = run_dir / filename
            if not path.is_file():
                continue

            try:
                text = path.read_text(encoding="utf-8-sig")

                if path.suffix == ".jsonl":
                    data = [
                        json.loads(line)
                        for line in text.splitlines()
                        if line.strip()
                    ]
                else:
                    data = json.loads(text)

            except (OSError, ValueError) as exc:
                raise SystemExit(
                    f"Could not read {path}: {exc}"
                ) from exc

            run["reports"][filename] = data

        if run["reports"]:
            bundle["runs"].append(run)

if not bundle["runs"]:
    raise SystemExit("No reports found; no output file was created.")

output.write_text(
    json.dumps(bundle, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

print(f"Runs merged: {len(bundle['runs'])}")
print(f"Output: {output.resolve()}")
print(f"Size: {output.stat().st_size / 1024 / 1024:.2f} MB")