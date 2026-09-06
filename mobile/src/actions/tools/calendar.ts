import { Logger } from '../../store';
import { Platform } from 'react-native';

import RNCalendarEvents, {
  type CalendarEventWritable,
  type RecurrenceFrequency,
  type ISODateString,
  type Calendar,
} from 'react-native-calendar-events';

// Incoming API format (your backend's format)
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
  startDate: ISODateString;
  endDate?: ISODateString;
  allDay?: boolean;
  location?: string;
  timezone?: string;
  calendarId?: string;
  recurrenceRule?: IncomingRecurrenceRule;
  alarms?: IncomingAlarm[];
}

// Helper to get or find a valid calendar ID
const getValidCalendarId = async (
  requestedId?: string,
): Promise<string | undefined> => {
  try {
    const calendars: Calendar[] = await RNCalendarEvents.findCalendars();

    if (calendars.length === 0) {
      Logger.error('No calendars found on device');
      return undefined;
    }

    Logger.info('Available calendars:', {
      calendars: calendars.map(c => ({
        id: c.id,
        title: c.title,
        isPrimary: c.isPrimary,
        allowsModifications: c.allowsModifications,
      })),
    });

    // If a specific calendar was requested
    if (requestedId) {
      // Check if it's "primary"
      if (requestedId.toLowerCase() === 'primary') {
        const primaryCal = calendars.find(
          (cal: Calendar) => cal.isPrimary && cal.allowsModifications,
        );
        if (primaryCal) {
          Logger.info('Using primary calendar:', { id: primaryCal.id });
          return primaryCal.id;
        }
      }

      // Try to find by exact ID match
      const calendarById = calendars.find(
        (cal: Calendar) => cal.id === requestedId,
      );
      if (calendarById?.allowsModifications) {
        Logger.info('Using calendar by ID:', { id: calendarById.id });
        return calendarById.id;
      }

      // Try to find by title
      const calendarByTitle = calendars.find(
        (cal: Calendar) =>
          cal.title.toLowerCase() === requestedId.toLowerCase() &&
          cal.allowsModifications,
      );
      if (calendarByTitle) {
        Logger.info('Using calendar by title:', { id: calendarByTitle.id });
        return calendarByTitle.id;
      }

      Logger.warn(`Calendar "${requestedId}" not found, using default`);
    }

    // Find the primary calendar or first writable calendar
    const primaryCalendar = calendars.find(
      (cal: Calendar) => cal.isPrimary && cal.allowsModifications,
    );
    if (primaryCalendar) {
      Logger.info('Using primary calendar as default:', {
        id: primaryCalendar.id,
      });
      return primaryCalendar.id;
    }

    const writableCalendar = calendars.find(
      (cal: Calendar) => cal.allowsModifications,
    );
    if (writableCalendar) {
      Logger.info('Using first writable calendar:', {
        id: writableCalendar.id,
      });
      return writableCalendar.id;
    }

    // Last resort: return first calendar
    Logger.warn('Using first available calendar:', { id: calendars[0].id });
    return calendars[0].id;
  } catch (error) {
    Logger.error('Error finding calendars:', { error });
    return undefined;
  }
};

// Helper to convert frequency from uppercase to lowercase
const convertFrequency = (
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
): RecurrenceFrequency => {
  return frequency.toLowerCase() as RecurrenceFrequency;
};

export const addCalendarEvent = async (
  event: IncomingCalendarEvent,
): Promise<string | null> => {
  try {
    // Check/request permission first
    const status = await RNCalendarEvents.requestPermissions();

    if (status !== 'authorized') {
      Logger.error('Calendar permission not granted:', { status });
      return null;
    }

    // Get a valid calendar ID
    const validCalendarId = await getValidCalendarId(event.calendarId);

    if (!validCalendarId) {
      Logger.error('No valid calendar found');
      return null;
    }

    // Build the CalendarEventWritable object using library types
    const eventDetails: any = {
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay ?? false,
      calendarId: validCalendarId,
    };

    // Add optional fields only if they have values
    if (event.location) {
      eventDetails.location = event.location;
    }

    // Handle platform-specific description/notes field
    if (event.description) {
      if (Platform.OS === 'ios') {
        eventDetails.notes = event.description;
      } else {
        eventDetails.description = event.description;
      }
    }

    // Add timezone (iOS only)
    if (event.timezone && Platform.OS === 'ios') {
      eventDetails.timeZone = event.timezone;
    }

    // Handle alarms
    if (event.alarms && event.alarms.length > 0) {
      eventDetails.alarms = event.alarms.map(alarm => ({
        date: alarm.minutesBefore, // Number = minutes before event
      }));
    }

    // Handle recurrence rule
    if (event.recurrenceRule) {
      const rule = event.recurrenceRule;

      eventDetails.endDate = undefined; // This line fixed the problem of the recurrenceRule, the error in the crashing program.

      // Use recurrenceRule for detailed control
      eventDetails.recurrenceRule = {
        frequency: rule.frequency.toLowerCase() as RecurrenceFrequency,
        interval: rule.interval ?? 1,
      };

      if (rule.count && rule.count > 0) {
        eventDetails.recurrenceRule.occurrence = rule.count;
      } else if (rule.until) {
        eventDetails.recurrenceRule.endDate = rule.until;
      }

      // Log warning about byDay limitation
      if (rule.byDay && rule.byDay.length > 0) {
        Logger.warn(
          'byDay recurrence is not supported by the library. Event will recur based on the start date weekday.',
        );
      }
    }

    Logger.info('Creating calendar event:', {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      calendarId: validCalendarId,
      recurrenceRule: eventDetails.recurrenceRule,
    });

    // Create the event using the library's saveEvent method
    const eventId: string = await RNCalendarEvents.saveEvent(
      event.title,
      eventDetails,
    );

    Logger.info('Event created successfully:', { eventId });
    return eventId;
  } catch (error) {
    Logger.error('Error adding calendar event:', { error });
    return null;
  }
};

// Helper to list available calendars for debugging
export const listAvailableCalendars = async (): Promise<Calendar[]> => {
  try {
    const status = await RNCalendarEvents.requestPermissions();
    if (status !== 'authorized') {
      Logger.warn('Calendar permission not granted');
      return [];
    }

    const calendars: Calendar[] = await RNCalendarEvents.findCalendars();
    Logger.info('Available calendars:', {
      count: calendars.length,
      calendars: calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        type: cal.type,
        isPrimary: cal.isPrimary,
        allowsModifications: cal.allowsModifications,
        color: cal.color,
      })),
    });
    return calendars;
  } catch (error) {
    Logger.error('Error listing calendars:', { error });
    return [];
  }
};

// // Helper to fetch events in a date range
// export const fetchCalendarEvents = async (
//   startDate: ISODateString,
//   endDate: ISODateString,
//   calendarIds?: string[],
// ) => {
//   try {
//     const status = await RNCalendarEvents.requestPermissions();
//     if (status !== 'authorized') {
//       Logger.error('Calendar permission not granted');
//       return [];
//     }

//     const events = await RNCalendarEvents.fetchAllEvents(
//       startDate,
//       endDate,
//       calendarIds,
//     );

//     Logger.info('Fetched events:', { count: events.length });
//     return events;
//   } catch (error) {
//     Logger.error('Error fetching events:', { error });
//     return [];
//   }
// };

// // Helper to remove an event
// export const removeCalendarEvent = async (
//   eventId: string,
// ): Promise<boolean> => {
//   try {
//     const status = await RNCalendarEvents.requestPermissions();
//     if (status !== 'authorized') {
//       Logger.error('Calendar permission not granted');
//       return false;
//     }

//     const success = await RNCalendarEvents.removeEvent(eventId);
//     Logger.info('Event removed:', { eventId, success });
//     return success;
//   } catch (error) {
//     Logger.error('Error removing event:', { error });
//     return false;
//   }
// };
