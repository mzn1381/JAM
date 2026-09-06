const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}

function readArgs(argv) {
  const values = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

    if (inlineValue !== undefined) {
      values[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      values[key] = next;
      index += 1;
    } else {
      values[key] = 'true';
    }
  }

  return values;
}

const args = readArgs(process.argv.slice(2));

const config = {
  baseUrl: args.baseUrl || process.env.BASE_URL || 'http://localhost:8000',
  users: args.users || process.env.USERS || '50',
  concurrentUsers: args.concurrentUsers || process.env.CONCURRENT_USERS || '10',
  duration: args.duration || process.env.DURATION || '5m',
  thinkTimeSeconds: args.thinkTimeSeconds || process.env.THINK_TIME_SECONDS || '1',
  resultsDir: args.resultsDir || process.env.RESULTS_DIR || 'results',
  runId: args.runId || process.env.RUN_ID || timestamp(),
};

const runResultsDir = join(config.resultsDir, config.runId);
const journeyLogPath = join(runResultsDir, 'journeys.log');
const successDetailLogPath = join(runResultsDir, 'successes-detail.log');
const failureDetailLogPath = join(runResultsDir, 'failures-detail.log');
mkdirSync(runResultsDir, { recursive: true });

function readConsoleRecord(line) {
  const cleanedLine = line.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').trim();
  const jsonStart = cleanedLine.indexOf('{');
  const jsonEnd = cleanedLine.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd >= jsonStart) {
    try {
      return JSON.parse(cleanedLine.slice(jsonStart, jsonEnd + 1));
    } catch {
      // Fall through to logfmt msg parsing.
    }
  }

  const rawMessageMatch = cleanedLine.match(/\bmsg="((?:\\.|[^"\\])*)"/);
  const message = rawMessageMatch ? JSON.parse(`"${rawMessageMatch[1]}"`) : cleanedLine;

  return JSON.parse(message);
}

const k6Args = [
  'run',
  `--console-output=${journeyLogPath}`,
  '-e',
  `RUN_ID=${config.runId}`,
  '-e',
  `RESULTS_DIR=${config.resultsDir}`,
  '-e',
  `BASE_URL=${config.baseUrl}`,
  '-e',
  `USERS=${config.users}`,
  '-e',
  `CONCURRENT_USERS=${config.concurrentUsers}`,
  '-e',
  `DURATION=${config.duration}`,
  '-e',
  `THINK_TIME_SECONDS=${config.thinkTimeSeconds}`,
  'script.js',
];

console.log(`Run ID: ${config.runId}`);
console.log(`Results folder: ${runResultsDir}`);

const result = spawnSync('k6', k6Args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (existsSync(journeyLogPath)) {
  const lines = readFileSync(journeyLogPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const successLines = [];
  const failureLines = [];

  for (const line of lines) {
    try {
      const record = readConsoleRecord(line);
      if (record.type !== 'chat_journey_step') {
        continue;
      }

      if (record.status === 'success') {
        successLines.push(JSON.stringify(record));
      } else if (record.status === 'failure') {
        failureLines.push(JSON.stringify(record));
      }
    } catch {
      // Ignore non-JSON k6 console lines.
    }
  }

  writeFileSync(successDetailLogPath, successLines.join('\n') + (successLines.length ? '\n' : ''));
  writeFileSync(failureDetailLogPath, failureLines.join('\n') + (failureLines.length ? '\n' : ''));
}

process.exit(result.status ?? 1);
