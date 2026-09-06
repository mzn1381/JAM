/**
 * Web fallback for the "double back to exit" hook.
 *
 * The browser has no hardware back button and react-native-web does not
 * implement ToastAndroid, so this is a safe no-op that keeps the same hook
 * signature the shared App uses.
 */
export const useDoubleBackToExit = () => {
  // Intentionally empty on web.
};
