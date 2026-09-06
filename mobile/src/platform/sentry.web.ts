/**
 * Web-safe Sentry shim.
 *
 * The shared codebase (and the native entry) import from `@sentry/react-native`.
 * On web the Vite config aliases `@sentry/react-native` to this file so the same
 * import paths keep working while we transparently use `@sentry/react`.
 *
 * Everything is wrapped defensively: monitoring must never crash the web app.
 */
import * as SentryReact from '@sentry/react';

export * from '@sentry/react';

type AnyOptions = Record<string, unknown>;

/**
 * Initialise the web SDK. Mobile-only options (e.g. mobileReplayIntegration)
 * are ignored gracefully.
 */
export function init(options: AnyOptions = {}): void {
  try {
    SentryReact.init(options as Parameters<typeof SentryReact.init>[0]);
  } catch (error) {
    // Never let monitoring setup break the app.
    // eslint-disable-next-line no-console
    console.warn('[sentry.web] init skipped:', error);
  }
}

/** Default browser integrations (replay + browser tracing when available). */
export function defaultWebIntegrations(): unknown[] {
  const integrations: unknown[] = [];
  try {
    if (typeof SentryReact.browserTracingIntegration === 'function') {
      integrations.push(SentryReact.browserTracingIntegration());
    }
    if (typeof SentryReact.replayIntegration === 'function') {
      integrations.push(SentryReact.replayIntegration());
    }
  } catch {
    // ignore – return whatever we managed to build.
  }
  return integrations;
}

/**
 * No-op stand-in for the native `mobileReplayIntegration` so shared code that
 * references it does not break on web.
 */
export function mobileReplayIntegration(): unknown {
  return {} as unknown;
}

/**
 * `Sentry.wrap` on native returns a wrapped component. On web we simply return
 * the component untouched (the real error boundary lives in WebErrorBoundary).
 */
export function wrap<T>(component: T): T {
  return component;
}
