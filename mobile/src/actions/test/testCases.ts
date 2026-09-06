import { addCalendarEvent, listAvailableCalendars } from '../tools/calendar';
import type { IncomingCalendarEvent } from '../tools/calendar';
import { Logger } from '../../store';

// Test data from the prompts
const testCases: Array<{
  id: number;
  prompt: string;
  event: IncomingCalendarEvent;
  expectedBehavior: string;
}> = [
  {
    id: 1, //OK
    prompt: 'امروز ساعت ۱۳:۳۰ ناهار با تیم فنی در رستوران نزدیک شرکت.',
    event: {
      title: 'ناهار با تیم فنی',
      startDate: '2025-12-22T13:30:00.000Z',
      endDate: '2025-12-22T14:30:00.000Z',
      allDay: false,
      location: 'رستوران نزدیک شرکت',
      timezone: 'Asia/Tehran',
    },
    expectedBehavior: 'Should create a simple 1-hour event with location',
  },
  {
    id: 2, //OK
    prompt: 'فردا ساعت ۱۰ صبح یک جلسه کاری دارم، برای یک ساعت ثبتش کن.',
    event: {
      title: 'جلسه کاری',
      startDate: '2025-12-23T10:00:00.000Z',
      endDate: '2025-12-23T11:00:00.000Z',
      allDay: false,
      timezone: 'Asia/Tehran',
    },
    expectedBehavior: 'Should create a basic 1-hour meeting without location',
  },
  {
    id: 3, //OK
    prompt: 'چهارشنبه ۲۴ دسامبر تولد برادرم است، کل روز را در تقویم علامت بزن.',
    event: {
      title: 'تولد برادر',
      startDate: '2025-12-24T00:00:00.000Z',
      endDate: '2025-12-24T23:59:59.000Z',
      allDay: true,
    },
    expectedBehavior: 'Should create an all-day event (birthday)',
  },
  {
    id: 4, //NOK
    prompt:
      'از امروز به مدت یک هفته، هر روز ساعت ۱۸:۰۰ نیم ساعت برو پیاده‌روی.',
    event: {
      title: 'پیاده‌روی روزانه',
      startDate: '2025-12-22T18:00:00.000Z',
      endDate: undefined, //<-- REMOVE THIS
      recurrenceRule: {
        frequency: 'DAILY',
        interval: 1,
        count: 7,
      },
    },
    expectedBehavior: 'Should create daily recurring event for 7 days',
  },
  {
    id: 5, //OK
    prompt:
      'پنجشنبه ساعت ۱۶:۰۰ نوبت دندان‌پزشکی دارم. نیم ساعت قبلش بهم یادآوری کن.',
    event: {
      title: 'نوبت دندان‌پزشکی',
      startDate: '2025-12-25T16:00:00.000Z',
      endDate: '2025-12-25T17:00:00.000Z',
      alarms: [
        {
          minutesBefore: 30,
          method: 'popup',
        },
      ],
    },
    expectedBehavior: 'Should create event with 30-minute reminder alarm',
  },
  {
    id: 6, //OK
    prompt:
      'کلاس زبان هر هفته دوشنبه‌ها ساعت ۱۷:۰۰. از امروز شروع بشه و کلاً ۱۰ جلسه است.',
    event: {
      title: 'کلاس زبان',
      startDate: '2025-12-22T17:00:00.000Z',
      endDate: undefined, //<-- REMOVE THIS
      recurrenceRule: {
        frequency: 'WEEKLY',
        interval: 1,
        byDay: ['MO'],
        count: 10,
      },
    },
    expectedBehavior:
      'Should create weekly recurring event (10 times). WARNING: byDay not supported',
  },
  {
    id: 7, //OK
    prompt:
      'جلسه ماهانه ساختمان، اولین یکشنبه هر ماه ساعت ۹ صبح. تا آخر سال ۲۰۲۷ تکرار بشه.',
    event: {
      title: 'جلسه ساختمان',
      startDate: '2026-01-04T09:00:00.000Z',
      endDate: undefined, //<-- REMOVE THIS
      recurrenceRule: {
        frequency: 'MONTHLY',
        interval: 1,
        until: '2026-12-31T23:59:59.000Z',
      },
    },
    expectedBehavior: 'Should create monthly recurring event until end of 2026',
  },
  {
    id: 8,
    prompt:
      'سفر به کیش از جمعه ۵ دی تا یکشنبه ۷ دی. تمام روز. لوکیشن هتل داریوش و توضیحات: بلیط‌ها در ایمیل است.',
    event: {
      title: 'سفر کیش',
      description: 'بلیط‌ها در ایمیل است',
      startDate: '2025-12-26T00:00:00.000Z',
      endDate: '2025-12-28T23:59:59.000Z',
      allDay: true,
      location: 'هتل داریوش، کیش',
    },
    expectedBehavior:
      'Should create multi-day all-day event with description and location',
  },
  {
    id: 9,
    prompt:
      'کلاس یوگا دوشنبه‌ها و چهارشنبه‌ها ساعت ۸ صبح در باشگاه سلامت. نیم ساعت قبلش آلارم بذار.',
    event: {
      title: 'کلاس یوگا',
      startDate: '2025-12-22T08:00:00.000Z',
      endDate: undefined, //<-- REMOVE THIS
      location: 'باشگاه سلامت',
      alarms: [
        {
          minutesBefore: 30,
          method: 'popup',
        },
      ],
      recurrenceRule: {
        frequency: 'WEEKLY',
        interval: 1,
        byDay: ['MO', 'WE'],
      },
    },
    expectedBehavior:
      'Should create weekly recurring event with alarm. WARNING: byDay (multiple days) not supported',
  },
  {
    id: 10,
    prompt:
      'جلسه دفاع پایان‌نامه برای دوشنبه ۱۵ دی ساعت ۹ صبح. دو تا یادآوری بذار: یکی ۱۵ دقیقه قبل و یکی یک ساعت قبل. توضیحات: فایل پاورپوینت فراموش نشود.',
    event: {
      title: 'دفاع پایان‌نامه',
      description: 'فایل پاورپوینت فراموش نشود',
      startDate: '2026-01-05T09:00:00.000Z',
      endDate: '2026-01-05T11:00:00.000Z',
      alarms: [
        {
          minutesBefore: 15,
          method: 'popup',
        },
        {
          minutesBefore: 60,
          method: 'popup',
        },
      ],
    },
    expectedBehavior:
      'Should create event with multiple alarms (15min and 60min before)',
  },
];

// Test runner
export const runCalendarTests = async () => {
  Logger.info('🧪 Starting Calendar Event Tests...');

  // First, list available calendars
  Logger.info('📅 Listing available calendars...');
  const calendars = await listAvailableCalendars();
  Logger.info('Found calendars', { count: calendars.length });

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [] as Array<{
      id: number;
      prompt: string;
      status: 'PASS' | 'FAIL' | 'WARNING';
      eventId?: string;
      error?: string;
      message: string;
    }>,
  };

  // Run each test case
  for (const testCase of testCases) {
    Logger.info('--- Test Case ---', {
      id: testCase.id,
      prompt: testCase.prompt,
      expected: testCase.expectedBehavior,
    });

    try {
      const eventId = await addCalendarEvent(testCase.event);

      if (eventId) {
        Logger.info('✅ PASS - Event created', {
          testId: testCase.id,
          eventId,
        });
        results.passed++;
        results.details.push({
          id: testCase.id,
          prompt: testCase.prompt,
          status: 'PASS',
          eventId,
          message: testCase.expectedBehavior,
        });

        // Check for warnings
        if (testCase.event.recurrenceRule?.byDay) {
          Logger.warn('⚠️  byDay recurrence not supported by library');
          results.warnings++;
        }
      } else {
        Logger.error('❌ FAIL - Event creation returned null', {
          testId: testCase.id,
        });
        results.failed++;
        results.details.push({
          id: testCase.id,
          prompt: testCase.prompt,
          status: 'FAIL',
          message: 'Event creation returned null',
        });
      }
    } catch (error) {
      Logger.error('❌ FAIL - Error occurred', {
        testId: testCase.id,
        error,
      });
      results.failed++;
      results.details.push({
        id: testCase.id,
        prompt: testCase.prompt,
        status: 'FAIL',
        error: String(error),
        message: testCase.expectedBehavior,
      });
    }

    // Small delay between tests
    // await new Promise(resolve => setTimeout(resolve, 500));
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
  }

  // Print summary
  Logger.info('========== TEST SUMMARY ==========', {
    totalTests: testCases.length,
    passed: results.passed,
    failed: results.failed,
    warnings: results.warnings,
  });

  return results;
};

// Validation report
export const generateValidationReport = async () => {
  const results = await runCalendarTests();

  Logger.info('📊 VALIDATION REPORT');

  // Known limitations
  Logger.warn('⚠️  KNOWN LIMITATIONS:');
  Logger.warn(
    '1. byDay recurrence (e.g., "every Monday and Wednesday") is NOT supported',
  );
  Logger.warn('2. Events will recur based on the startDate weekday');
  Logger.warn('3. Alarm "method" (popup/email) is ignored by the library');

  // Test case analysis
  Logger.info('📋 TEST CASE ANALYSIS');

  results.details.forEach(detail => {
    const icon = detail.status === 'PASS' ? '✅' : '❌';
    Logger.info(`${icon} Test ${detail.id}: ${detail.status}`, {
      prompt: detail.prompt,
      eventId: detail.eventId,
      error: detail.error,
    });
  });

  return results;
};

// Individual test function
export const testSingleEvent = async (testId: number) => {
  const testCase = testCases.find(tc => tc.id === testId);

  if (!testCase) {
    Logger.error('Test case not found', { testId });
    return null;
  }

  Logger.info('🧪 Testing single event', {
    prompt: testCase.prompt,
    event: testCase.event,
  });

  const eventId = await addCalendarEvent(testCase.event);

  if (eventId) {
    Logger.info('✅ SUCCESS - Event created', { eventId });
  } else {
    Logger.error('❌ FAILED - Could not create event');
  }

  return eventId;
};

// Export test cases for reference
export { testCases };
