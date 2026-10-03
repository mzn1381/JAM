import argparse
import json
import time
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import requests

# Reuse the existing connection settings without modifying the old file.
import run_fardowsi_ragflow_benchmark as config


BASE_URL = config.RAGFLOW_BASE_URL
API_KEY = config.RAGFLOW_API_KEY
CHAT_ID = config.CHAT_ID
TIMEOUT = config.TIMEOUT_SECONDS
PASS_ALL_HISTORY = config.PASS_ALL_HISTORY_MESSAGES

ROOT = Path(__file__).resolve().parent


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def append_jsonl(path, record):
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def write_json(path, value):
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_tests(path):
    tests = []
    ids = set()

    with path.open(encoding="utf-8-sig") as f:
        for line_number, line in enumerate(f, start=1):
            if not line.strip():
                continue

            item = json.loads(line)
            test_id = item.get("id")

            if not isinstance(test_id, str) or not test_id.strip():
                raise ValueError(f"Line {line_number}: invalid scenario ID")
            if test_id in ids:
                raise ValueError(f"Duplicate scenario ID: {test_id}")

            turns = item.get("turns")
            if not isinstance(turns, list) or not turns:
                raise ValueError(f"{test_id}: turns must be a nonempty list")

            for turn in turns:
                if not isinstance(turn, dict):
                    raise ValueError(f"{test_id}: invalid turn")
                question = turn.get("question")
                if not isinstance(question, str) or not question.strip():
                    raise ValueError(f"{test_id}: invalid question")

            ids.add(test_id)
            tests.append(item)

    # This runner initially targets exactly the selected diagnostic set.
    if not tests:
        raise ValueError("Test file must contain at least one scenario")

    return tests


def post_json(path, payload):
    """One request only. No automatic retry or redirect following."""
    result = {
        "http_status": None,
        "latency_seconds": None,
        "raw_response": None,
        "raw_response_text": None,
        "error": None,
    }
    started = time.perf_counter()

    try:
        response = requests.post(
            f"{BASE_URL}{path}",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=TIMEOUT,
            allow_redirects=False,
        )
        result["http_status"] = response.status_code

        try:
            result["raw_response"] = response.json()
        except ValueError:
            result["raw_response_text"] = response.text

        if not 200 <= response.status_code < 300:
            result["error"] = {
                "type": "http_error",
                "message": f"HTTP {response.status_code}",
            }
        elif result["raw_response"] is None:
            result["error"] = {
                "type": "invalid_json",
                "message": "Response is not a JSON object",
            }
        elif not isinstance(result["raw_response"], dict):
            result["error"] = {
                "type": "invalid_response",
                "message": "Expected a JSON object",
            }
        elif result["raw_response"].get("code") not in (0, None):
            body = result["raw_response"]
            result["error"] = {
                "type": "api_error",
                "code": body.get("code"),
                "message": body.get("message") or body.get("msg"),
            }

    except requests.Timeout as exc:
        result["error"] = {"type": "timeout", "message": str(exc)}
    except requests.ConnectionError as exc:
        result["error"] = {"type": "connection_error", "message": str(exc)}
    except requests.RequestException as exc:
        result["error"] = {"type": "request_error", "message": str(exc)}
    finally:
        result["latency_seconds"] = round(
            time.perf_counter() - started, 4
        )

    return result


def response_data(result):
    body = result.get("raw_response")
    if not isinstance(body, dict):
        return {}
    data = body.get("data", body)
    return data if isinstance(data, dict) else {}


def chat_payload(question, session_id, history):
    current = {"role": "user", "content": question}

    # Default False preserves your existing API behavior:
    # send the latest message; let the server use session history.
    messages = history + [current] if PASS_ALL_HISTORY else [current]

    return {
        "chat_id": CHAT_ID,
        "session_id": session_id,
        "messages": messages,
        "stream": False,
        "pass_all_history_messages": PASS_ALL_HISTORY,
    }


def make_summary(run_id, records, interrupted, tests):
    planned_scenarios = len(tests)
    planned_user_messages = sum(len(t["turns"]) for t in tests)
    statuses = Counter(r["status"] for r in records)
    latencies = [
        r["latency_seconds"]
        for r in records
        if r["request_sent"] and r["latency_seconds"] is not None
    ]

    by_scenario = {}
    for record in records:
        by_scenario.setdefault(record["scenario_id"], []).append(record)

    complete_scenarios = sum(
        len(rows) == rows[0]["scenario_turn_count"]
        and all(r["status"] == "success" for r in rows)
        for rows in by_scenario.values()
    )

    return {
        "run_id": run_id,
        "chat_id": CHAT_ID,
        "interrupted": interrupted,
        "planned_scenarios": planned_scenarios,
        "planned_user_messages": planned_user_messages,
        "recorded_user_messages": len(records),
        "unrecorded_user_messages": planned_user_messages - len(records),
        "status_counts": dict(statuses),
        "api_successful_scenarios": complete_scenarios,
        "mean_chat_request_latency_seconds": (
            round(sum(latencies) / len(latencies), 4)
            if latencies else None
        ),
        "automatic_retry": False,
        "answer_quality_evaluation": "not_performed",
        "note": "Success means API/response success, not factual correctness.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--tests", type=Path, default=ROOT / "diagnostic_tests.jsonl"
    )
    parser.add_argument(
        "--output-dir", type=Path, default=ROOT / "diagnostic_results"
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    tests = load_tests(args.tests)

    total_messages = sum(len(t["turns"]) for t in tests)
    print(f"RAGFlow: {BASE_URL}")
    print(f"Scenarios: {len(tests)} | User messages: {total_messages}")    
    print(f"Chat ID: {CHAT_ID}")
    print(f"Pass all history: {PASS_ALL_HISTORY}")

    if args.dry_run:
        for scenario in tests:
            for number, turn in enumerate(scenario["turns"], 1):
                # Validate payload serialization without making API calls.
                payload = chat_payload(
                    turn["question"], "DRY_RUN_SESSION", []
                )
                json.dumps(payload, ensure_ascii=False)
                print(f"{scenario['id']}/T{number}: {turn['question']}")
        print("DRY RUN OK: no API requests sent.")
        return

    run_id = (
        datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        + "_" + uuid.uuid4().hex[:8]
    )
    output = args.output_dir / run_id
    output.mkdir(parents=True, exist_ok=False)

    write_json(output / "tests_snapshot.json", tests)
    write_json(output / "run_config.json", {
        "run_id": run_id,
        "started_at": utc_now(),
        "base_url": BASE_URL,
        "chat_id": CHAT_ID,
        "timeout_seconds": TIMEOUT,
        "pass_all_history_messages": PASS_ALL_HISTORY,
        "automatic_retry": False,
        "session_policy": "one new session per scenario",
    })

    records = []
    used_sessions = set()
    interrupted = False

    print(f"Output: {output.resolve()}")

    try:
        for scenario in tests:
            test_id = scenario["id"]
            session_payload = {"name": f"Diagnostic-{run_id}-{test_id}"}

            session_result = post_json(
                f"/api/v1/chats/{CHAT_ID}/sessions",
                session_payload,
            )
            session_id = None

            if session_result["error"] is None:
                session_id = response_data(session_result).get("id")
                if not isinstance(session_id, str) or not session_id:
                    session_result["error"] = {
                        "type": "missing_session_id",
                        "message": "Session response has no valid data.id",
                    }
                    session_id = None
                elif session_id in used_sessions:
                    session_result["error"] = {
                        "type": "duplicate_session_id",
                        "message": "Session ID already used in this run",
                    }
                else:
                    used_sessions.add(session_id)

            append_jsonl(output / "session_events.jsonl", {
                "run_id": run_id,
                "scenario_id": test_id,
                "timestamp": utc_now(),
                "request_payload": session_payload,
                **session_result,
            })

            history = []
            blocked_by = None

            for number, turn in enumerate(scenario["turns"], start=1):
                record = {
                    "run_id": run_id,
                    "scenario_id": test_id,
                    "goal": scenario["goal"],
                    "turn_id": number,
                    "scenario_turn_count": len(scenario["turns"]),
                    "question": turn["question"],
                    "reference_answer": turn.get("reference_answer"),
                    "evidence_lines": turn.get("evidence_lines"),
                    "source_verification": turn.get("source_verification"),
                    "session_id": session_id,
                    "history_before": list(history),
                    "history_after": list(history),
                    "request_sent": False,
                    "request_payload": None,
                    "status": None,
                    "failure_stage": None,
                    "answer": None,
                    "reference": None,
                    "http_status": None,
                    "latency_seconds": None,
                    "raw_response": None,
                    "raw_response_text": None,
                    "error": None,
                    "timestamp": utc_now(),
                }

                if blocked_by is not None:
                    record["status"] = "skipped"
                    record["error"] = {
                        "type": "previous_turn_failed",
                        "message": f"Blocked by turn {blocked_by}",
                    }

                elif session_result["error"] is not None:
                    record["status"] = "error"
                    record["failure_stage"] = "create_session"
                    record["error"] = session_result["error"]
                    blocked_by = number

                else:
                    payload = chat_payload(
                        turn["question"], session_id, history
                    )
                    record["request_sent"] = True
                    record["request_payload"] = payload

                    result = post_json("/api/v1/chat/completions", payload)
                    data = response_data(result)

                    if result["error"] is None:
                        answer = data.get("answer") or data.get("content")
                        if not isinstance(answer, str) or not answer.strip():
                            result["error"] = {
                                "type": "empty_or_invalid_answer",
                                "message": "No nonempty answer/content string",
                            }
                        else:
                            record["answer"] = answer

                    record.update(result)
                    record["reference"] = data.get("reference")

                    # This is local history of attempted chat turns.
                    # On failure, later turns are skipped.
                    history.append({
                        "role": "user",
                        "content": turn["question"],
                    })

                    if result["error"] is not None:
                        record["status"] = "error"
                        record["failure_stage"] = "chat"
                        blocked_by = number
                    else:
                        record["status"] = "success"
                        history.append({
                            "role": "assistant",
                            "content": record["answer"],
                        })

                    record["history_after"] = list(history)

                records.append(record)
                append_jsonl(output / "results.jsonl", record)

                print(
                    f"{test_id}/T{number} "
                    f"{record['status']} "
                    f"latency={record['latency_seconds']}"
                )
                if record["answer"]:
                    print(f"  {record['answer'][:200]}")
                elif record["error"]:
                    print(f"  {record['error']}")

    except KeyboardInterrupt:
        interrupted = True
        print("\nInterrupted. Completed records are preserved.")
    finally:
        write_json(output / "results.json", records)
        write_json(
            output / "summary.json",
            make_summary(run_id, records, interrupted, tests),        )
        print(f"\nSaved: {output.resolve()}")


if __name__ == "__main__":
    main()