/**
 * @format
 */
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import * as Sentry from '@sentry/react-native';
import { BASE_SENTRY_DNS } from './src/utils/constants';

Sentry.init({
  dsn: BASE_SENTRY_DNS,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

AppRegistry.registerComponent(appName, () => Sentry.wrap(App));
