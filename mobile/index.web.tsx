/**
 * Web entry point (Vite + react-native-web).
 *
 * Mirrors index.js (the native entry) but:
 *  - uses @sentry/react instead of @sentry/react-native (via the web shim)
 *  - wraps the app in a web error boundary so a thrown native-only call can
 *    never take the whole page down
 *  - mounts through AppRegistry.runApplication which sets up the RNW root.
 *
 * The Android/iOS entry (index.js) is untouched.
 */
import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import * as Sentry from './src/platform/sentry.web';
import { BASE_SENTRY_DNS } from './src/utils/constants';
import { WebErrorBoundary } from './src/platform/WebErrorBoundary';
import { getAppMode } from './src/utils/useAppMode';

Sentry.init({
  dsn: BASE_SENTRY_DNS,
  sendDefaultPii: true,
  enableLogs: true,
  // Session Replay (web SDK). Safe no-ops if unavailable.
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: Sentry.defaultWebIntegrations(),
});

const Root = () => {
  const appMode = getAppMode();
  useEffect(() => {
    if (appMode === 'demo') {
      Sentry.setTag('appMode', appMode);
      document.body.style.maxWidth = 'initial';
    } else if (appMode === 'internal') {
      Sentry.setTag('appMode', appMode);
    } else if (appMode === 'embed') {
      Sentry.setTag('appMode', appMode);
      document.body.style.maxWidth = 'initial';
    } else {
      Sentry.setTag('appMode', 'default');
      console.warn(
        'App is running in default mode. For demo, embed, or internal modes, use the "mode" query parameter in the URL.',
      );
    }
  }, []);
  return (
    <WebErrorBoundary>
      <App />
    </WebErrorBoundary>
  );
};

AppRegistry.registerComponent(appName, () => Root);

AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
