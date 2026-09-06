import { NativeModules } from 'react-native';

const { AlarmModule } = NativeModules;

/**
  This is the only method that works on: (gpt-5)
  
    Pixel phones
    Android 12–16
    Samsung OneUI
    Xiaomi MIUI 14/15
    Oppo/Vivo
 */

/**
 * // Set alarm
 * Sets a non-repeating, one-time alarm.
 * @param hour The hour (0-23) for the alarm.
 * @param minute The minute (0-59) for the alarm.
 * @param message The message or label for the alarm.
 * @param skipUI Whether to skip showing the alarm creation UI (boolean).
 * @returns A promise that resolves when the operation is complete.
 */

// Set alarm
export const setAlarm = async (
  hour: number,
  minute: number,
  message?: string,
  skipUI: boolean = false,
): Promise<void> => {
  return AlarmModule.setAlarm(hour, minute, message, skipUI);
};

/**
 * // Open alarm list
 * Opens the native alarm list/section of the device's clock app.
 * @returns A promise that resolves when the operation is complete.
 */
export const openAlarms = async (): Promise<void> => {
  // Your example already provided the implementation, using it here for completeness
  return AlarmModule.openAlarms();
};

/**
 * // Check if setting alarms is supported
 * Checks if the underlying platform/device supports setting new alarms.
 * @returns A promise that resolves with a boolean: true if supported, false otherwise.
 */
export const checkAlarmSupport = async (): Promise<boolean> => {
  return AlarmModule.checkAlarmSupport();
};
/**
 * // Repeating alarm every 10 minutes
 * Sets a repeating alarm with a specified interval.
 * @param id A unique identifier for the alarm.
 * @param hour The starting hour (0-23) for the alarm.
 * @param minute The starting minute (0-59) for the alarm.
 * @param message The message or label for the alarm.
 * @param intervalMinutes The interval in minutes for the alarm to repeat.
 * @returns A promise that resolves when the operation is complete.
 */
export const setRepeatingAlarm = async (
  id: number,
  hour: number,
  minute: number,
  message: string,
  intervalMinutes: number,
): Promise<void> => {
  return AlarmModule.setRepeatingAlarm(
    id,
    hour,
    minute,
    message,
    intervalMinutes,
  );
};

/**
 * // Cancel alarm
 * Cancels a previously set alarm using its unique ID.
 * @param id The unique identifier of the alarm to cancel.
 * @returns A promise that resolves when the operation is complete.
 */
export const cancelAlarm = async (id: number): Promise<void> => {
  return AlarmModule.cancelAlarm(id);
};

// --- Timer Functions ---

/**
 * // Create timer (60 seconds)
 * Creates a timer for a specified duration.
 * @param durationSeconds The duration of the timer in seconds.
 * @param message The message or label for the timer.
 * @param skipUI Whether to skip showing the timer creation UI (boolean).
 * @returns A promise that resolves when the operation is complete.
 */
export const createTimer = async (
  durationSeconds: number,
  message: string,
  skipUI: boolean,
): Promise<void> => {
  return AlarmModule.createTimer(durationSeconds, message, skipUI);
};

/**
 * // Open timers
 * Opens the native timers list/section.
 * @returns A promise that resolves when the operation is complete.
 */
export const openTimers = async (): Promise<void> => {
  return AlarmModule.openTimers();
};

// --- Stopwatch Functions ---

/**
 * // Open stopwatch
 * Opens the native stopwatch section.
 * @returns A promise that resolves when the operation is complete.
 */
export const openStopwatch = async (): Promise<void> => {
  return AlarmModule.openStopwatch();
};

// // Set alarm
// AlarmModule.setAlarm(8, 30, 'Wake up', false);

// // Repeating alarm every 10 minutes
// AlarmModule.setRepeatingAlarm(101, 8, 30, 'Repeat alarm', 10);

// // Cancel alarm
// AlarmModule.cancelAlarm(101);

// // Create timer (60 seconds)
// AlarmModule.createTimer(60, 'Boiling egg', false);

// // Open timers
// AlarmModule.openTimers();

// // Open stopwatch
// AlarmModule.openStopwatch();

// // not working in android 12-16 but maybe working in 7-10
// export const openAlarmAppOldDevices = () => {
//   const intentUrl =
//     `intent://#Intent;` +
//     `action=android.intent.action.SET_ALARM;` +
//     `S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(
//       'sdfsdfsdfsdff',
//     )};` +
//     `i.android.intent.extra.alarm.HOUR=${12};` +
//     `i.android.intent.extra.alarm.MINUTES=${2};` +
//     `b.android.intent.extra.alarm.SKIP_UI=${false};` +
//     `end`;
//   Linking.openURL(intentUrl).catch(err => {
//     Alert.alert('Error', `Cannot open alarm app ${err}`), console.log(err);
//   });
// };

////////////////////////////////////////////////////
// ===================================================

// const createAlarm = async () => {
//   const supported = await checkAlarmSupport();
//   console.log(supported);
//   if (!supported) {
//     Alert.alert(
//       'Not supported',
//       'This device does not support alarm intents.',
//     );
//     return;
//   }

//   await setAlarm(
//     12,
//     30,
//     'Meeting',
//     false, // Samsung/Xiaomi ignore this
//   );

//   Alert.alert('Success', 'Alarm created!');
// };
