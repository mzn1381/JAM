/**
 * Web fallback for react-native-calendar-events.
 *
 * The browser has no device calendar integration, so event creation degrades
 * gracefully. The public API mirrors ./calendar (native) — including the
 * IncomingCalendarEvent type — so shared code and tests compile unchanged.
 */
import { Logger } from '../../store';
import { notifyFeatureUnavailable } from '../../platform/webFeature';

// Re-declared locally (kept in sync with ./calendar) so type-only imports
// like `import type { IncomingCalendarEvent } from '../tools/calendar'`
// resolve to the same shape on web.
interface IncomingRecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: Array<'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'>;
  count?: number;
  until?: string;
}

interface IncomingAlarm {
  minutesBefore: number;
  method: 'popup' | 'email';
}

export interface IncomingCalendarEvent {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  timezone?: string;
  calendarId?: string;
  recurrenceRule?: IncomingRecurrenceRule;
  alarms?: IncomingAlarm[];
}

const FEATURE = 'calendar';

export const addCalendarEvent = async (
  _event: IncomingCalendarEvent,
): Promise<string | null> => {
  notifyFeatureUnavailable(
    FEATURE,
    'افزودن رویداد به تقویم در نسخه‌ی وب پشتیبانی نمی‌شود.',
  );
  Logger.warn('[web] addCalendarEvent is not supported on web');
  return null;
};

export const listAvailableCalendars = async (): Promise<unknown[]> => {
  Logger.warn('[web] listAvailableCalendars is not supported on web');
  return [];
};
