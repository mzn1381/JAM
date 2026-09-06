/**
 * Shared helper for gracefully disabling native-only features on the web.
 *
 * Instead of throwing "Native module X not available", web fallbacks call this
 * to show a friendly Persian toast and log the event. Nothing here ever throws.
 */
import Toast from 'react-native-toast-message';
import { Logger } from '../store';
import { typography } from '../theme/typography';

const DEFAULT_MESSAGE = 'این قابلیت در نسخه‌ی وب در دسترس نیست.';

/**
 * Notify the user that a feature is not available in the web build.
 *
 * @param feature  A short identifier for logging (e.g. "alarm", "contacts").
 * @param message  Optional custom Persian message shown to the user.
 */
export function notifyFeatureUnavailable(
  feature: string,
  message: string = DEFAULT_MESSAGE,
): void {
  try {
    Logger.warn(`[web] Feature "${feature}" is not available on web`, {
      feature,
    });
  } catch {
    // Logger may not be ready during early init – ignore.
  }

  try {
    Toast.show({
      type: 'info',
      text2: message,
      text2Style: {
        fontFamily: typography.fontFamily,
        fontSize: 14,
      },
      visibilityTime: 3000,
    });
  } catch {
    // Toast host may not be mounted yet – ignore.
  }
}

/** Whether the code is currently running in a browser environment. */
export const IS_WEB = true;
