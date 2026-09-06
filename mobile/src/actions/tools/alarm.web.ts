/**
 * Web fallback for the native Alarm module (NativeModules.AlarmModule).
 *
 * Browsers cannot create device alarms/timers. Every entry point degrades
 * gracefully with a friendly Persian message and never throws, keeping the
 * public API identical to ./alarm (native) so shared code needs no changes.
 */
import { notifyFeatureUnavailable } from '../../platform/webFeature';

const FEATURE = 'alarm';

export const setAlarm = async (
  _hour: number,
  _minute: number,
  _message?: string,
  _skipUI: boolean = false,
): Promise<void> => {
  notifyFeatureUnavailable(
    FEATURE,
    'تنظیم آلارم در نسخه‌ی وب پشتیبانی نمی‌شود.',
  );
};

export const openAlarms = async (): Promise<void> => {
  notifyFeatureUnavailable(FEATURE);
};

export const checkAlarmSupport = async (): Promise<boolean> => {
  return false;
};

export const setRepeatingAlarm = async (
  _id: number,
  _hour: number,
  _minute: number,
  _message: string,
  _intervalMinutes: number,
): Promise<void> => {
  notifyFeatureUnavailable(
    FEATURE,
    'تنظیم آلارم در نسخه‌ی وب پشتیبانی نمی‌شود.',
  );
};

export const cancelAlarm = async (_id: number): Promise<void> => {
  notifyFeatureUnavailable(FEATURE);
};

export const createTimer = async (
  _durationSeconds: number,
  _message: string,
  _skipUI: boolean,
): Promise<void> => {
  notifyFeatureUnavailable(
    FEATURE,
    'تنظیم تایمر در نسخه‌ی وب پشتیبانی نمی‌شود.',
  );
};

export const openTimers = async (): Promise<void> => {
  notifyFeatureUnavailable(FEATURE);
};

export const openStopwatch = async (): Promise<void> => {
  notifyFeatureUnavailable(FEATURE);
};
