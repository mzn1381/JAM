# k6 Stress Testing for AI Service

This folder contains a k6 stress test for the FastAPI chat endpoint:

- `POST /api/v2/Chat`

The script simulates a user journey with three sequential messages. Each journey keeps the same generated `chatId` across all three calls, and the next call is sent only when the previous call succeeds.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [k6](https://k6.io/docs/getting-started/installation/)
- The FastAPI AI service running locally or at the configured `BASE_URL`

## Running Tests

From this directory:

```bash
cd server/Tests/AI.StressTest
node run.js
```

Smoke test against the local FastAPI server:

```bash
node run.js --base-url http://localhost:8000 --users 1 --concurrent-users 1 --duration 30s --think-time-seconds 0
```

Stress run:

```bash
node run.js --base-url http://localhost:8000 --users 100 --concurrent-users 20 --duration 10m --think-time-seconds 1
```

The runner automatically creates:

```text
results/<RUN_ID>/
```

and passes that folder to k6 for all generated output.

## Configuration

Every option can be passed as a CLI flag or environment variable:

- `--base-url` / `BASE_URL`: API base URL. Default: `http://localhost:8000`
- `--users` / `USERS`: Total number of full user journeys to run. Default: `50`
- `--concurrent-users` / `CONCURRENT_USERS`: Number of simultaneous virtual users. Default: `10`
- `--duration` / `DURATION`: Maximum time allowed for all journeys. Default: `5m`
- `--think-time-seconds` / `THINK_TIME_SECONDS`: Delay between successful journey steps. Default: `1`
- `--results-dir` / `RESULTS_DIR`: Parent output directory for run folders. Default: `results`
- `--run-id` / `RUN_ID`: Optional id for the per-run folder. Default: generated timestamp

## Output

Each run writes to `results/<RUN_ID>/`.

- `journeys.log`: Detailed per-step and per-journey success/failure JSON records
- `summary.json`: Full machine-readable k6 summary
- `summary.txt`: Human-readable success/failure summary
- `result-summary.json`: Compact machine-readable run summary
- `successes.json`: Aggregate success counts and rates
- `failures.json`: Aggregate failure counts and rates

The generated `results` folder is ignored by git.

## Direct k6 Usage

k6 can write files into an existing folder, but it cannot create nested folders from inside `script.js`. If you bypass `run.js`, create the run folder first:

```bash
k6 run --console-output=results/<RUN_ID>/journeys.log -e RUN_ID=<RUN_ID> script.js
```
