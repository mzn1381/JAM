/**
 * Converts a Unix timestamp (milliseconds) to a time string in the format HH:MM AM/PM.
 * * @param {number} timestamp The Unix timestamp in milliseconds.
 * @returns {string} The formatted time string (e.g., "03:07 AM").
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);

  // Use toLocaleTimeString to get the local time in 12-hour format.
  // 'en-US' locale is used because it reliably uses the AM/PM system.
  // hour12: true ensures the AM/PM format is used.
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit', // Ensure two digits (e.g., 03)
    minute: '2-digit', // Ensure two digits (e.g., 07)
    hour12: true, // Force the AM/PM indicator
  };

  return date.toLocaleTimeString('en-US', options);
}

// --- Examples ---
// const currentTimestamp = 1733547900000; // Sunday, December 7, 2025 3:05:00 AM CET
// const afternoonTimestamp = 1733580000000; // Sunday, December 7, 2025 12:40:00 PM CET

// const currentTime = formatTime(currentTimestamp);
// const afternoonTime = formatTime(afternoonTimestamp);

// console.log(`Current Time: ${currentTime}`);     // Output (using example timestamp): 03:05 AM
// console.log(`Afternoon Time: ${afternoonTime}`); // Output (using example timestamp): 12:40 PM

/**
 * Alternative implementation using Intl.DateTimeFormat for locale support.
 * @param {number} timestamp The Unix timestamp in milliseconds.
 * @returns {string} The formatted date-time string (e.g., "12-15-2025 9:00 AM").
 */
export function formatDateTimeLocale(
  timestamp: number,
  useInLogger?: boolean,
  formatStyle: 'default' | 'relative' = 'default',
): string {
  const date = new Date(timestamp);

  if (!useInLogger && formatStyle === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // If timestamp is in the future, fall back to calendar format.
    if (diffMs >= 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMinutes < 1) {
        return 'همین الان';
      }

      if (diffMinutes < 60) {
        return `${diffMinutes.toLocaleString('fa-IR')} دقیقه پیش`;
      }

      if (diffHours < 24) {
        return `${diffHours.toLocaleString('fa-IR')} ساعت پیش`;
      }

      if (diffDays < 7) {
        return `${diffDays.toLocaleString('fa-IR')} روز پیش`;
      }
    }

    const persianDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);

    const persianTime = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    return `${persianDate} - ${persianTime}`;
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    second: useInLogger ? '2-digit' : undefined,
    hour12: !useInLogger,
  };

  const datePart = date.toLocaleDateString('en-US', dateOptions);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart} ${timePart}`;
}

// Example usage:
// formatDateTime(1734278400000) // Returns: "12-15-2025 9:00 AM"
// formatDateTimeLocale(1734278400000) // Returns: "12/15/2025 9:00 AM" (then replace "/" with "-")
// formatDateTimeLocale(1734278400000, false, 'relative') // Returns: "۵ روز پیش" or "پنجشنبه ۳۱ خرداد"
