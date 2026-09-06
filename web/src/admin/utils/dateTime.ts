type ParsedBackendDateTime = {
  year: number
  month: number
  day: number
  hour: number | null
  minute: number | null
  second: number | null
  offsetMinutes: number | null
}

const BACKEND_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?)?(?:([Zz])|([+-])(\d{2}):(\d{2}))?$/

function isValueInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

function getLocalizedNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    useGrouping: false,
    minimumIntegerDigits: 2,
  }).format(value)
}

function parseBackendDateTime(value: string): ParsedBackendDateTime | null {
  const normalizedValue = value.trim()
  const match = BACKEND_DATE_TIME_PATTERN.exec(normalizedValue)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = match[4] ? Number(match[4]) : null
  const minute = match[5] ? Number(match[5]) : null
  const second = match[6] ? Number(match[6]) : null
  const hasZuluOffset = Boolean(match[7])
  const offsetSign = match[8]
  const offsetHour = match[9] ? Number(match[9]) : null
  const offsetMinute = match[10] ? Number(match[10]) : null

  if (!isValueInRange(month, 1, 12) || !isValueInRange(day, 1, 31)) {
    return null
  }

  if (hour !== null && !isValueInRange(hour, 0, 23)) {
    return null
  }

  if (minute !== null && !isValueInRange(minute, 0, 59)) {
    return null
  }

  if (second !== null && !isValueInRange(second, 0, 59)) {
    return null
  }

  let offsetMinutes: number | null = null

  if (hasZuluOffset) {
    offsetMinutes = 0
  } else if (offsetSign && offsetHour !== null && offsetMinute !== null) {
    if (
      !isValueInRange(offsetHour, 0, 23) ||
      !isValueInRange(offsetMinute, 0, 59)
    ) {
      return null
    }

    const rawOffset = offsetHour * 60 + offsetMinute
    offsetMinutes = offsetSign === '+' ? rawOffset : -rawOffset
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    offsetMinutes,
  }
}

export function formatBackendDateTime(
  value: string,
  locale: string,
): string | null {
  const parsed = parseBackendDateTime(value)

  if (!parsed) {
    return null
  }

  const year = new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    useGrouping: false,
    minimumIntegerDigits: 4,
  }).format(parsed.year)
  const month = getLocalizedNumber(parsed.month, locale)
  const day = getLocalizedNumber(parsed.day, locale)
  const datePart = `${year}/${month}/${day}`

  if (parsed.hour === null || parsed.minute === null) {
    return datePart
  }

  const hour = getLocalizedNumber(parsed.hour, locale)
  const minute = getLocalizedNumber(parsed.minute, locale)

  return `${datePart} ${hour}:${minute}`
}

export function formatBackendDate(
  value: string,
  locale: string,
): string | null {
  const parsed = parseBackendDateTime(value)

  if (!parsed) {
    return null
  }

  const month = getLocalizedNumber(parsed.month, locale)
  const day = getLocalizedNumber(parsed.day, locale)

  return `${month}/${day}`
}

export function isBackendDateTimeExpired(
  value: string,
  nowUtcMillis = Date.now(),
): boolean | null {
  const parsed = parseBackendDateTime(value)

  if (!parsed || parsed.hour === null || parsed.minute === null) {
    return null
  }

  const utcMillis = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second ?? 0,
  )

  const offsetMinutes = parsed.offsetMinutes ?? 0
  const normalizedUtcMillis = utcMillis - offsetMinutes * 60_000

  return normalizedUtcMillis < nowUtcMillis
}
