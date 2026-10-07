import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import requests

# import run_fardowsi_ragflow_benchmark as config


# ============================================================
# Configuration
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

SCENARIOS_PATH = Path("JAM\\eval\\silver_dataset_whc_astra_p1.jsonl") ## GOLDEN DATASET !! 
# from contaminating another through conversation history.
NEW_SESSION_PER_QUESTION = True

# Keep this False for the first baseline run unless your server/API
# specifically requires all messages to be sent.
PASS_ALL_HISTORY_MESSAGES = False

TIMEOUT_SECONDS = 180
# RAGFLOW_BASE_URL = config.RAGFLOW_BASE_URL.rstrip("/")
# RAGFLOW_API_KEY = config.RAGFLOW_API_KEY
# CHAT_ID = config.CHAT_ID

# TIMEOUT_SECONDS = getattr(config, "TIMEOUT_SECONDS", 120)
# PASS_ALL_HISTORY_MESSAGES = getattr(config, "PASS_ALL_HISTORY_MESSAGES", True)

# SCENARIOS_PATH = Path(config.SCENARIOS_PATH)
# OUTPUT_DIR = Path(
#     getattr(
#         config,
#         "OUTPUT_DIR",
#         Path(__file__).resolve().parent / "runs"
#     )
# )

RUN_ID = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S") + "_" + uuid.uuid4().hex[:6]
RUN_DIR = OUTPUT_DIR / RUN_ID

RUN_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================
# HTTP helpers
# ============================================================

HEADERS = {
    "Authorization": f"Bearer {RAGFLOW_API_KEY}",
    "Content-Type": "application/json",
}


def post_json(path, payload):
    url = f"{RAGFLOW_BASE_URL}{path}"

    started_at = time.time()

    try:
        response = requests.post(
            url,
            headers=HEADERS,
            json=payload,
            timeout=TIMEOUT_SECONDS,
        )

        elapsed = time.time() - started_at

        try:
            body = response.json()
        except ValueError:
            body = {
                "text": response.text
            }

        return {
            "ok": response.ok,
            "status_code": response.status_code,
            "elapsed_seconds": elapsed,
            "body": body,
            "error": None,
        }

    except requests.RequestException as exc:
        elapsed = time.time() - started_at

        return {
            "ok": False,
            "status_code": None,
            "elapsed_seconds": elapsed,
            "body": None,
            "error": str(exc),
        }


def response_data(result):
    body = result.get("body")

    if not isinstance(body, dict):
        return {}

    data = body.get("data", body)

    return data if isinstance(data, dict) else {}


# ============================================================
# Dataset helpers
# ============================================================

def load_jsonl(path):
    items = []

    with path.open("r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, start=1):
            line = line.strip()

            if not line:
                continue

            try:
                items.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"Invalid JSONL at line {line_number}: {exc}"
                ) from exc

    return items


def save_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(
            data,
            f,
            ensure_ascii=False,
            indent=2,
        )


def append_jsonl(path, data):
    with path.open("a", encoding="utf-8") as f:
        f.write(
            json.dumps(
                data,
                ensure_ascii=False,
            )
            + "\n"
        )


# ============================================================
# RAGFlow
# ============================================================

def create_session(test_id):
    session_name = f"Diagnostic-{RUN_ID}-{test_id}"

    payload = {
        "name": session_name
    }

    result = post_json(
        f"/api/v1/chats/{CHAT_ID}/sessions",
        payload,
    )

    if not result["ok"]:
        return None, result

    data = response_data(result)

    session_id = data.get("id")

    if not session_id:
        session_id = data.get("session_id")

    return session_id, result


def ask_ragflow(session_id, question, history):
    payload = {
        "question": question,
        "stream": False,
        "session_id": session_id,
    }

    if PASS_ALL_HISTORY_MESSAGES:
        payload["messages"] = history

    return post_json(
        f"/api/v1/chats/{CHAT_ID}/completions",
        payload,
    )


# ============================================================
# Retrieval extraction
# ============================================================

def extract_retrieved_chunks(data):
    """
    Extract the chunks actually returned by RAGFlow.

    Returns:
        retrieved_contexts:
            Only chunk text. This will later be used by RAGAS.

        retrieved_chunks:
            Full retrieval information for debugging/analysis.
    """

    reference_data = data.get("reference", {})

    if not isinstance(reference_data, dict):
        return [], []

    chunks = reference_data.get("chunks", [])

    if not isinstance(chunks, list):
        return [], []

    retrieved_contexts = []
    retrieved_chunks = []

    for rank, chunk in enumerate(chunks, start=1):

        if not isinstance(chunk, dict):
            continue

        content = chunk.get("content")

        # ----------------------------------------------------
        # Contexts used later by RAGAS
        # ----------------------------------------------------

        if isinstance(content, str) and content.strip():
            retrieved_contexts.append(content)

        # ----------------------------------------------------
        # Full retrieval information for debugging
        # ----------------------------------------------------

        retrieved_chunks.append(
            {
                "rank": rank,
                "id": chunk.get("id"),
                "dataset_id": chunk.get("dataset_id"),
                "document_id": chunk.get("document_id"),
                "document_name": chunk.get("document_name"),
                "content": content,
                "similarity": chunk.get("similarity"),
                "vector_similarity": chunk.get(
                    "vector_similarity"
                ),
                "term_similarity": chunk.get(
                    "term_similarity"
                ),
                "positions": chunk.get("positions"),
            }
        )

    return retrieved_contexts, retrieved_chunks


# ============================================================
# Main benchmark
# ============================================================

def main():

    print("=" * 70)
    print("RAGFlow Benchmark")
    print("=" * 70)

    print(f"Run ID       : {RUN_ID}")
    print(f"Dataset      : {SCENARIOS_PATH}")
    print(f"Output       : {RUN_DIR}")
    print(f"Chat ID      : {CHAT_ID}")
    print()

    scenarios = load_jsonl(SCENARIOS_PATH)

    print(f"Scenarios loaded: {len(scenarios)}")
    print()

    # --------------------------------------------------------
    # Snapshot of the exact Golden Dataset used
    # --------------------------------------------------------

    save_json(
        RUN_DIR / "tests_snapshot.json",
        scenarios,
    )

    # --------------------------------------------------------
    # Run configuration
    # --------------------------------------------------------

    run_config = {
        "run_id": RUN_ID,
        "ragflow_base_url": RAGFLOW_BASE_URL,
        "chat_id": CHAT_ID,
        "timeout_seconds": TIMEOUT_SECONDS,
        "pass_all_history_messages": PASS_ALL_HISTORY_MESSAGES,
        "scenarios_path": str(SCENARIOS_PATH),
        "started_at": datetime.now(timezone.utc).isoformat(),
    }

    save_json(
        RUN_DIR / "run_config.json",
        run_config,
    )

    # --------------------------------------------------------
    # Output files
    # --------------------------------------------------------

    results_jsonl_path = RUN_DIR / "results.jsonl"
    session_events_path = RUN_DIR / "session_events.jsonl"

    all_results = []

    total_turns = 0
    successful_turns = 0
    failed_turns = 0

    # ========================================================
    # Scenario loop
    # ========================================================

    for scenario_index, scenario in enumerate(
        scenarios,
        start=1,
    ):

        test_id = scenario.get("id")

        turns = scenario.get("turns", [])

        print(
            f"[{scenario_index}/{len(scenarios)}] "
            f"{test_id} - {len(turns)} turn(s)"
        )

        # ----------------------------------------------------
        # One independent RAGFlow session per scenario
        # ----------------------------------------------------

        session_id, session_result = create_session(test_id)

        append_jsonl(
            session_events_path,
            {
                "run_id": RUN_ID,
                "test_id": test_id,
                "event": "create_session",
                "session_id": session_id,
                "result": session_result,
                "timestamp": datetime.now(
                    timezone.utc
                ).isoformat(),
            },
        )

        if not session_id:

            print(
                f"  ERROR: Could not create session for {test_id}"
            )

            for turn_index, turn in enumerate(
                turns,
                start=1,
            ):

                total_turns += 1
                failed_turns += 1

                question = turn.get("question", "")
                reference_answer = turn.get(
                    "reference_answer"
                )

                record = {
                    "run_id": RUN_ID,
                    "test_id": test_id,
                    "scenario_id": test_id,
                    "turn_id": turn_index,
                    "goal": scenario.get("goal"),

                    "question": question,
                    "reference_answer": reference_answer,

                    "answer": None,

                    # RAGFlow raw reference
                    "reference": None,

                    # RAGAS
                    "retrieved_contexts": [],
                    "retrieved_chunks": [],
                    "retrieved_chunk_count": 0,

                    "session_id": None,

                    "success": False,
                    "error": "Failed to create RAGFlow session",
                    "raw_response": session_result,
                }

                append_jsonl(
                    results_jsonl_path,
                    record,
                )

                all_results.append(record)

            continue

        # ----------------------------------------------------
        # Conversation history for this scenario
        # ----------------------------------------------------

        history = []

        # ====================================================
        # Turn loop
        # ====================================================

        for turn_index, turn in enumerate(
            turns,
            start=1,
        ):

            total_turns += 1

            question = turn.get(
                "question",
                "",
            )

            reference_answer = turn.get(
                "reference_answer"
            )

            print(
                f"  Turn {turn_index}/{len(turns)}"
            )
            print(
                f"  Q: {question}"
            )

            # ------------------------------------------------
            # Ask RAGFlow
            # ------------------------------------------------

            result = ask_ragflow(
                session_id=session_id,
                question=question,
                history=history,
            )

            data = response_data(result)

            # ------------------------------------------------
            # Extract answer
            # ------------------------------------------------

            answer = (
                data.get("answer")
                or data.get("content")
            )

            # ------------------------------------------------
            # Extract RAGFlow retrieval
            # ------------------------------------------------

            (
                retrieved_contexts,
                retrieved_chunks,
            ) = extract_retrieved_chunks(data)

            # ------------------------------------------------
            # Build result record
            # ------------------------------------------------

            record = {
                "run_id": RUN_ID,

                # Keep both names for compatibility
                "test_id": test_id,
                "scenario_id": test_id,

                "turn_id": turn_index,
                "goal": scenario.get("goal"),

                "question": question,

                # IMPORTANT:
                # This is the Golden Dataset ground truth.
                "reference_answer": reference_answer,

                # Model answer
                "answer": answer,

                # RAGFlow's raw reference object.
                # This is NOT the Golden reference answer.
                "reference": data.get("reference"),

                # ------------------------------------------------
                # Retrieval data for RAGAS
                # ------------------------------------------------

                # Only text of retrieved chunks
                "retrieved_contexts": retrieved_contexts,

                # Full retrieval metadata
                "retrieved_chunks": retrieved_chunks,

                "retrieved_chunk_count": len(
                    retrieved_chunks
                ),

                # ------------------------------------------------
                # Session
                # ------------------------------------------------

                "session_id": session_id,

                # ------------------------------------------------
                # API information
                # ------------------------------------------------

                "success": bool(
                    result.get("ok")
                    and answer is not None
                ),

                "status_code": result.get(
                    "status_code"
                ),

                "elapsed_seconds": result.get(
                    "elapsed_seconds"
                ),

                "error": result.get(
                    "error"
                ),

                # Keep raw response for debugging
                "raw_response": result,
            }

            # ------------------------------------------------
            # Save result
            # ------------------------------------------------

            append_jsonl(
                results_jsonl_path,
                record,
            )

            all_results.append(record)

            # ------------------------------------------------
            # Update counters
            # ------------------------------------------------

            if record["success"]:
                successful_turns += 1
            else:
                failed_turns += 1

            # ------------------------------------------------
            # Add current turn to history
            # ------------------------------------------------

            if record["success"]:

                history.append(
                    {
                        "role": "user",
                        "content": question,
                    }
                )

                history.append(
                    {
                        "role": "assistant",
                        "content": answer,
                    }
                )

            # ------------------------------------------------
            # If API failed, stop remaining turns
            # of this scenario.
            # ------------------------------------------------

            if not record["success"]:

                print(
                    f"  ERROR: "
                    f"{record.get('error') or 'RAGFlow request failed'}"
                )

                break

            print(
                f"  Answer: {answer}"
            )

            print(
                f"  Retrieved chunks: "
                f"{len(retrieved_chunks)}"
            )

            print()

    # ========================================================
    # Save results.json
    # ========================================================

    save_json(
        RUN_DIR / "results.json",
        all_results,
    )

    # ========================================================
    # Summary
    # ========================================================

    summary = {
        "run_id": RUN_ID,

        "scenario_count": len(scenarios),

        "total_turns": total_turns,
        "successful_turns": successful_turns,
        "failed_turns": failed_turns,

        "success_rate": (
            successful_turns / total_turns
            if total_turns
            else 0
        ),

        "results_file": str(
            results_jsonl_path
        ),

        "completed_at": datetime.now(
            timezone.utc
        ).isoformat(),
    }

    save_json(
        RUN_DIR / "summary.json",
        summary,
    )

    # ========================================================
    # Final output
    # ========================================================

    print("=" * 70)
    print("Benchmark completed")
    print("=" * 70)

    print(
        f"Scenarios        : {len(scenarios)}"
    )

    print(
        f"Total turns      : {total_turns}"
    )

    print(
        f"Successful turns : {successful_turns}"
    )

    print(
        f"Failed turns     : {failed_turns}"
    )

    print(
        f"Success rate     : {summary['success_rate']:.2%}"
    )

    print()

    print(
        f"Results JSONL: {results_jsonl_path}"
    )

    print(
        f"Run directory: {RUN_DIR}"
    )


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    main()