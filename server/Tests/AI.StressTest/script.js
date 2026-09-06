import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const TOTAL_USERS = parseInt(__ENV.USERS || '50', 10);
const CONCURRENT_USERS = parseInt(__ENV.CONCURRENT_USERS || '10', 10);
const MAX_DURATION = __ENV.DURATION || '5m';
const THINK_TIME_SECONDS = Number(__ENV.THINK_TIME_SECONDS || '1');
const RESULTS_DIR = __ENV.RESULTS_DIR || 'results';
const RUN_ID = __ENV.RUN_ID || new Date().toISOString().replace(/[:.]/g, '-');
const RUN_RESULTS_DIR = `${RESULTS_DIR}/${RUN_ID}`;

const endpoint = `${BASE_URL}/api/v2/Chat`;

const journeySuccess = new Counter('chat_journey_success_total');
const journeyFailure = new Counter('chat_journey_failure_total');
const stepSuccess = new Counter('chat_step_success_total');
const stepFailure = new Counter('chat_step_failure_total');
const journeySuccessRate = new Rate('chat_journey_success_rate');
const stepSuccessRate = new Rate('chat_step_success_rate');
const journeyDuration = new Trend('chat_journey_duration_ms');

export const options = {
  scenarios: {
    chat_user_journey: {
      executor: 'shared-iterations',
      vus: CONCURRENT_USERS,
      iterations: TOTAL_USERS,
      maxDuration: MAX_DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<30000'],
    chat_journey_success_rate: ['rate>0.95'],
    chat_step_success_rate: ['rate>0.95'],
  },
};

const steps = [
  {
    name: 'greeting',
    message: 'سلام، خوبی؟',
  },
  {
    name: 'appointment_request',
    message: 'میخام یه نوبت دکتر بگیرم برای معدم تو قم',
  },
  {
    name: 'doctor_profile_selection',
    message: '###Paziresh24###DoctorProfile###دکتر-حسین-ثقفی-1',
  },
];

function createChatId() {
  return `k6-chat-${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPayload(chatId, message) {
  return {
    chatId,
    tasks: [
      {
        chatId,
        message,
        intent: 'string',
        confidence: 0,
        user_language: 'string',
      },
    ],
  };
}

function parseJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function responseSucceeded(response, body) {
  return response.status >= 200 && response.status < 300 && body !== null && body.success === true;
}

function logResult(status, details) {
  console.log(JSON.stringify({
    type: 'chat_journey_step',
    status,
    runId: RUN_ID,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

function postStep(chatId, step, stepIndex) {
  const payload = createPayload(chatId, step.message);
  const response = http.post(endpoint, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    tags: {
      endpoint: '/api/v2/Chat',
      journey_step: step.name,
    },
  });

  const body = parseJson(response);
  const succeeded = responseSucceeded(response, body);

  check(response, {
    [`${step.name}: status is 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${step.name}: response is json`]: () => body !== null,
    [`${step.name}: success is true`]: () => body !== null && body.success === true,
    [`${step.name}: errorCode is 0`]: () => body !== null && body.errorCode === 0,
  });

  stepSuccessRate.add(succeeded);

  if (succeeded) {
    stepSuccess.add(1);
    logResult('success', {
      chatId,
      vu: __VU,
      iteration: __ITER,
      step: step.name,
      stepIndex,
      httpStatus: response.status,
      responseHeaders: response.headers,
      responseBody: response.body,
      durationMs: response.timings.duration,
      responseText: body.message,
      errorCode: body.errorCode,
    });
    return true;
  }

  stepFailure.add(1);
  logResult('failure', {
    chatId,
    vu: __VU,
    iteration: __ITER,
    step: step.name,
    stepIndex,
    httpStatus: response.status,
    responseHeaders: response.headers,
    durationMs: response.timings.duration,
    responseBody: response.body,
    parsedMessage: body && body.message,
    errorCode: body && body.errorCode,
  });

  return false;
}

export default function () {
  const chatId = createChatId();
  const started = Date.now();
  const completedSteps = [];

  for (let index = 0; index < steps.length; index += 1) {
    const succeeded = postStep(chatId, steps[index], index + 1);
    if (!succeeded) {
      journeyFailure.add(1);
      journeySuccessRate.add(false);
      journeyDuration.add(Date.now() - started);
      console.log(JSON.stringify({
        type: 'chat_journey',
        status: 'failure',
        runId: RUN_ID,
        timestamp: new Date().toISOString(),
        chatId,
        vu: __VU,
        iteration: __ITER,
        failedStep: steps[index].name,
        failedStepIndex: index + 1,
        completedSteps,
        durationMs: Date.now() - started,
      }));
      return;
    }

    completedSteps.push(steps[index].name);

    if (THINK_TIME_SECONDS > 0 && index < steps.length - 1) {
      sleep(THINK_TIME_SECONDS);
    }
  }

  journeySuccess.add(1);
  journeySuccessRate.add(true);
  journeyDuration.add(Date.now() - started);
  console.log(JSON.stringify({
    type: 'chat_journey',
    status: 'success',
    runId: RUN_ID,
    timestamp: new Date().toISOString(),
    chatId,
    vu: __VU,
    iteration: __ITER,
    completedSteps,
    durationMs: Date.now() - started,
  }));
}

export function handleSummary(data) {
  const metrics = data.metrics;
  const successCount = metrics.chat_journey_success_total?.values?.count || 0;
  const failureCount = metrics.chat_journey_failure_total?.values?.count || 0;
  const stepSuccessCount = metrics.chat_step_success_total?.values?.count || 0;
  const stepFailureCount = metrics.chat_step_failure_total?.values?.count || 0;
  const journeySuccessRateValue = metrics.chat_journey_success_rate?.values?.rate || 0;
  const stepSuccessRateValue = metrics.chat_step_success_rate?.values?.rate || 0;
  const httpFailureRate = metrics.http_req_failed?.values?.rate || 0;
  const httpDurationP95 = metrics.http_req_duration?.values?.['p(95)'] || 0;
  const journeyDurationP95 = metrics.chat_journey_duration_ms?.values?.['p(95)'] || 0;

  const resultSummary = {
    runId: RUN_ID,
    baseUrl: BASE_URL,
    endpoint,
    configuredJourneys: TOTAL_USERS,
    concurrentUsers: CONCURRENT_USERS,
    maxDuration: MAX_DURATION,
    thinkTimeSeconds: THINK_TIME_SECONDS,
    success: {
      journeys: successCount,
      steps: stepSuccessCount,
      journeyRate: journeySuccessRateValue,
      stepRate: stepSuccessRateValue,
    },
    failure: {
      journeys: failureCount,
      steps: stepFailureCount,
      httpRequestFailureRate: httpFailureRate,
    },
    duration: {
      httpRequestP95Ms: httpDurationP95,
      journeyP95Ms: journeyDurationP95,
    },
    logCapture: {
      note: 'Detailed success and failure journey records are emitted as JSON lines through console.log.',
      command: `k6 run --console-output=${RUN_RESULTS_DIR}/journeys.log -e RUN_ID=${RUN_ID} script.js`,
    },
  };

  const summary = [
    'Chat endpoint stress test summary',
    `Run ID: ${RUN_ID}`,
    `Base URL: ${BASE_URL}`,
    `Endpoint: ${endpoint}`,
    `Configured users/journeys: ${TOTAL_USERS}`,
    `Concurrent users: ${CONCURRENT_USERS}`,
    `Max duration: ${MAX_DURATION}`,
    '',
    `Journey success count: ${successCount}`,
    `Journey failure count: ${failureCount}`,
    `Step success count: ${stepSuccessCount}`,
    `Step failure count: ${stepFailureCount}`,
    `Journey success rate: ${journeySuccessRateValue}`,
    `Step success rate: ${stepSuccessRateValue}`,
    `HTTP request failure rate: ${httpFailureRate}`,
    `HTTP request duration p95 ms: ${httpDurationP95}`,
    `Journey duration p95 ms: ${journeyDurationP95}`,
    '',
    'Detailed per-step and per-journey records are emitted as JSON lines through console.log.',
    `Run output folder: ${RUN_RESULTS_DIR}`,
    `Capture them without PowerShell by running: k6 run --console-output=${RUN_RESULTS_DIR}/journeys.log -e RUN_ID=${RUN_ID} script.js`,
    'For machine-readable aggregate results, inspect summary.json, successes.json, and failures.json.',
    '',
  ].join('\n');

  return {
    stdout: summary,
    [`${RUN_RESULTS_DIR}/summary.json`]: JSON.stringify(data, null, 2),
    [`${RUN_RESULTS_DIR}/summary.txt`]: summary,
    [`${RUN_RESULTS_DIR}/successes.json`]: JSON.stringify(resultSummary.success, null, 2),
    [`${RUN_RESULTS_DIR}/failures.json`]: JSON.stringify(resultSummary.failure, null, 2),
    [`${RUN_RESULTS_DIR}/result-summary.json`]: JSON.stringify(resultSummary, null, 2),
  };
}
