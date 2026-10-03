import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import Workbook


ROOT = Path(__file__).resolve().parent
RUNNER = ROOT / "run_fardowsi_ragflow_benchmark.py"

HEADERS = [
    "ID",
    "Question",
    "Question Type",
    "Difficulty",
    "Answerable",
    "Reference Answer",
    "Evidence Lines",
    "Evidence Text",
    "Primary Evaluation",
    "Notes",
]

TESTS = [
    [
        1,
        (
            "طبق آیین‌نامه آموزشی سطح دو، در حالت معمول و بدون اعمال "
            "استثناها، حداقل و حداکثر تعداد واحد در هر نیمسال چقدر است؟"
        ),
        "Simple Fact",
        "Easy",
        True,
        "حداقل ۱۲ و حداکثر ۲۰ واحد در هر نیمسال است.",
        "آیین‌نامه آموزشی سطح دو، ماده ۱۲",
        (
            "تعداد واحدهای درسی طلبه در هر نیمسال، با لحاظ حداکثر "
            "سنوات مجاز تحصیل، حداقل ۱۲ و حداکثر ۲۰ واحد است."
        ),
        "Correctness; Retrieval; Citation",
        (
            "هر دو عدد باید درست باشند. شاهد باید از سند سطح دو باشد. "
            "نباید سقف سطح سه یا سقف استثنایی جایگزین قاعده معمول شود."
        ),
    ],
    [
        2,
        (
            "طبق آیین‌نامه آموزشی سطح سه، در شیوه غیرحضوری و در حالت "
            "معمول و بدون اعمال استثناها، حداقل و حداکثر تعداد واحد "
            "در هر نیمسال چقدر است؟"
        ),
        "Simple Fact",
        "Easy",
        True,
        "در شیوه غیرحضوری، حداقل ۱۰ و حداکثر ۱۴ واحد است.",
        "آیین‌نامه آموزشی سطح سه، ماده ۱۳",
        (
            "تعداد واحدهای درسی طلبه در هر نیمسال، با لحاظ حداکثر "
            "سنوات مجاز تحصیل، در دوره‌ی حضوری و نیمه‌حضوری حداقل "
            "۱۰ و حداکثر ۱۶ واحد و در دوره‌‌ی غیرحضوری حداقل ۱۰ "
            "و حداکثر ۱۴ واحد است."
        ),
        "Correctness; Retrieval; Citation",
        (
            "هر دو عدد باید درست باشند. شاهد باید از سند سطح سه باشد. "
            "سقف ۱۶ واحد حضوری نباید به غیرحضوری نسبت داده شود."
        ),
    ],
]


def main():
    if not RUNNER.is_file():
        raise SystemExit(f"Runner not found: {RUNNER}")

    chat_id = input(
        "Enter the TEST assistant Chat ID: "
    ).strip()

    if not chat_id:
        raise SystemExit("Chat ID cannot be empty.")

    base_url = input(
        "RAGFlow base URL [Enter = use current runner configuration]: "
    ).strip().rstrip("/")

    run_id = datetime.now(timezone.utc).strftime(
        "%Y%m%dT%H%M%S_%fZ"
    )
    run_dir = ROOT / "runs" / f"smoke_{run_id}"
    run_dir.mkdir(parents=True, exist_ok=False)

    benchmark_path = run_dir / "regulations_smoke_v1.xlsx"

    wb = Workbook()
    ws = wb.active
    ws.title = "Benchmark"
    ws.append(HEADERS)

    for test in TESTS:
        ws.append(test)

    wb.save(benchmark_path)
    wb.close()

    env = os.environ.copy()
    env["RAGFLOW_CHAT_ID"] = chat_id
    env["BENCHMARK_XLSX"] = str(benchmark_path)
    env["OUTPUT_DIR"] = str(run_dir / "results")

    if base_url:
        env["RAGFLOW_BASE_URL"] = base_url

    print(f"\nInput: {benchmark_path}")
    print(f"Output: {env['OUTPUT_DIR']}")
    print("Running 2 independent questions...\n", flush=True)

    completed = subprocess.run(
        [sys.executable, str(RUNNER)],
        cwd=str(ROOT),
        env=env,
        check=False,
    )

    print(
        "\nInspect both records in the results file. "
        "Process completion alone does not mean the tests passed."
    )
    raise SystemExit(completed.returncode)


if __name__ == "__main__":
    main()