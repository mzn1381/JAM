import os
import json
import time
from pathlib import Path
from datetime import datetime

import requests
from openpyxl import load_workbook


# ============================================================
# CONFIG
# ============================================================
RAGFLOW_BASE_URL = os.getenv("RAGFLOW_BASE_URL", "http://172.16.1.81:9080/ragflow").rstrip("/")
RAGFLOW_API_KEY = os.getenv("RAGFLOW_API_KEY", "ragflow-iw1DpTqVoHMuzEhqDiXQKpmsfGvPDTz9mmgX1WtwJvQ")
CHAT_ID = os.getenv("RAGFLOW_CHAT_ID", "f8c50e20bf2e11f19c44397fd71b9367")

BENCHMARK_XLSX = Path(os.getenv(
    "BENCHMARK_XLSX",
    "Fardowsi_RAG_Benchmark_v1.xlsx"
))

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "ragflow_benchmark_results"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Important:
# One fresh session per question prevents one benchmark question
# from contaminating another through conversation history.
NEW_SESSION_PER_QUESTION = True

# Keep this False for the first baseline run unless your server/API
# specifically requires all messages to be sent.
PASS_ALL_HISTORY_MESSAGES = False

TIMEOUT_SECONDS = 180


# ============================================================
# HELPERS
# ============================================================
def fail(msg: str):
    raise RuntimeError(msg)


def load_questions(xlsx_path: Path):
    if not xlsx_path.exists():
        fail(f"Benchmark file not found: {xlsx_path}")

    wb = load_workbook(xlsx_path, data_only=True)
    ws = wb["Benchmark"]

    headers = [ws.cell(1, c).value for c in range(1, ws.max_column + 1)]
    rows = []

    for r in range(2, ws.max_row + 1):
        item = {headers[c - 1]: ws.cell(r, c).value for c in range(1, ws.max_column + 1)}
        if item["ID"] is not None:
            rows.append(item)

    return rows


def create_session(chat_id: str, session_name: str):
    """
    RAGFlow session creation endpoint.
    If your deployed version does not allow this endpoint for your key,
    the chat endpoint can usually create/use a supplied session ID.
    """
    url = f"{RAGFLOW_BASE_URL}/api/v1/chats/{chat_id}/sessions"
    headers = {
        "Authorization": f"Bearer {RAGFLOW_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"name": session_name}

    resp = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    body = resp.json()

    if body.get("code") not in (0, None):
        fail(f"Session creation failed: {body}")

    data = body.get("data", body)

    # Different RAGFlow builds may wrap the session differently.
    session_id = (
        data.get("id")
        if isinstance(data, dict)
        else None
    )

    if not session_id:
        fail(f"Could not find session id in response: {body}")

    return session_id


def chat(question: str, session_id: str):
    url = f"{RAGFLOW_BASE_URL}/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {RAGFLOW_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "chat_id": CHAT_ID,
        "session_id": session_id,
        "messages": [
            {"role": "user", "content": question}
        ],
        "stream": False,
        "pass_all_history_messages": PASS_ALL_HISTORY_MESSAGES,
    }

    started = time.perf_counter()

    resp = requests.post(
        url,
        headers=headers,
        json=payload,
        timeout=TIMEOUT_SECONDS,
    )

    latency = time.perf_counter() - started
    resp.raise_for_status()
    body = resp.json()

    if body.get("code") not in (0, None):
        fail(f"Chat failed: {body}")

    data = body.get("data", body)

    answer = ""
    reference = None

    if isinstance(data, dict):
        answer = data.get("answer") or data.get("content") or ""
        reference = data.get("reference")

    return {
        "http_status": resp.status_code,
        "latency_seconds": round(latency, 4),
        "answer": answer,
        "reference": reference,
        "raw_response": body,
    }


# ============================================================
# MAIN
# ============================================================
def main():
    if "YOUR-RAGFLOW" in RAGFLOW_BASE_URL:
        fail("Set RAGFLOW_BASE_URL first.")
    if RAGFLOW_API_KEY == "YOUR_API_KEY":
        fail("Set RAGFLOW_API_KEY first.")
    if CHAT_ID == "YOUR_CHAT_ID":
        fail("Set RAGFLOW_CHAT_ID first.")

    questions = load_questions(BENCHMARK_XLSX)

    print(f"Loaded {len(questions)} benchmark questions.")
    print(f"RAGFlow: {RAGFLOW_BASE_URL}")
    print(f"Chat ID: {CHAT_ID}")
    print()

    all_results = []

    for idx, q in enumerate(questions, start=1):
        qid = q["ID"]
        question = q["Question"]

        print(f"[{idx}/{len(questions)}] Q{qid}: {question}")

        session_id = None

        try:
            if NEW_SESSION_PER_QUESTION:
                session_id = create_session(
                    CHAT_ID,
                    f"Benchmark-Fardowsi-Q{qid}"
                )
            else:
                fail("For benchmark isolation, NEW_SESSION_PER_QUESTION should be True.")

            result = chat(question, session_id)

            record = {
                "benchmark_id": qid,
                "question": question,
                "question_type": q["Question Type"],
                "difficulty": q["Difficulty"],
                "answerable": q["Answerable"],
                "reference_answer": q["Reference Answer"],
                "evidence_lines": q["Evidence Lines"],
                "evidence_text": q["Evidence Text"],
                "primary_evaluation": q["Primary Evaluation"],
                "session_id": session_id,
                "answer": result["answer"],
                "reference": result["reference"],
                "latency_seconds": result["latency_seconds"],
                "http_status": result["http_status"],
                "raw_response": result["raw_response"],
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": None,
            }

            print(f"    latency={result['latency_seconds']}s")
            print(f"    answer={result['answer'][:180]!r}")

        except Exception as exc:
            record = {
                "benchmark_id": qid,
                "question": question,
                "question_type": q["Question Type"],
                "difficulty": q["Difficulty"],
                "answerable": q["Answerable"],
                "reference_answer": q["Reference Answer"],
                "evidence_lines": q["Evidence Lines"],
                "evidence_text": q["Evidence Text"],
                "primary_evaluation": q["Primary Evaluation"],
                "session_id": session_id,
                "answer": None,
                "reference": None,
                "latency_seconds": None,
                "http_status": None,
                "raw_response": None,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "error": str(exc),
            }

            print(f"    ERROR: {exc}")

        all_results.append(record)

    out_jsonl = OUTPUT_DIR / "fardowsi_ragflow_results.jsonl"
    with out_jsonl.open("w", encoding="utf-8") as f:
        for record in all_results:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

    # Also write a compact CSV-like JSON summary for quick inspection.
    out_json = OUTPUT_DIR / "fardowsi_ragflow_results.json"
    out_json.write_text(
        json.dumps(all_results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print()
    print("DONE")
    print(f"JSONL: {out_jsonl}")
    print(f"JSON : {out_json}")


if __name__ == "__main__":
    main()
