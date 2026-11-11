import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, startOfDay, endOfDay, startOfMonth, endOfMonth, format } from 'date-fns';

export const DEFAULT_BRANCH_TIMEZONE = 'Asia/Kolkata';

/**
 * Normalizes a date to the start of the day (00:00:00) in the given timezone,
 * and returns the absolute UTC Date corresponding to that moment.
 */
export function startOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const start = startOfDay(zoned);
  return fromZonedTime(start, timezone);
}

/**
 * Normalizes a date to the end of the day (23:59:59.999) in the given timezone,
 * and returns the absolute UTC Date corresponding to that moment.
 */
export function endOfDayInTimezone(date: Date, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const end = endOfDay(zoned);
  return fromZonedTime(end, timezone);
}

/**
 * Adds a specific number of calendar days to a date within a given timezone.
 */
export function addCalendarDaysInTimezone(date: Date, days: number, timezone: string): Date {
  const zoned = toZonedTime(date, timezone);
  const added = addDays(zoned, days);
  return fromZonedTime(added, timezone);
}

/**
 * Calculates the exact number of calendar days between two dates, evaluated in the target timezone.
 * Returns negative if end is before start.
 */
export function getCalendarDaysDifference(start: Date, end: Date, timezone: string): number {
  const zonedStart = toZonedTime(start, timezone);
  const zonedEnd = toZonedTime(end, timezone);
  return differenceInCalendarDays(zonedEnd, zonedStart);
}

/**
 * Returns the current absolute time. Use this instead of new Date() to allow mocking in tests if necessary.
 */
export function getCurrentDate(): Date {
  return new Date();
}

/**
 * Checks if the given target date is past the expiry date in the given timezone.
 */
export function isExpired(targetDate: Date, expiryDate: Date, timezone: string): boolean {
  // Expiry is endOfDay. If target date is past endOfDay, it's expired.
  const endOfExpiryDay = endOfDayInTimezone(expiryDate, timezone);
  return targetDate.getTime() > endOfExpiryDay.getTime();
}

/**
 * Returns the UTC instant corresponding to the start of the month (00:00:00.000) in the given timezone.
 */
export function startOfMonthInTimezone(date: Date, timezone: string = DEFAULT_BRANCH_TIMEZONE): Date {
  const zoned = toZonedTime(date, timezone);
  const start = startOfMonth(zoned);
  return fromZonedTime(start, timezone);
}

/**
 * Returns the UTC instant corresponding to the end of the month (23:59:59.999) in the given timezone.
 */
export function endOfMonthInTimezone(date: Date, timezone: string = DEFAULT_BRANCH_TIMEZONE): Date {
  const zoned = toZonedTime(date, timezone);
  const end = endOfMonth(zoned);
  return fromZonedTime(end, timezone);
}

/**
 * Formats an instant as a YYYY-MM-DD calendar date key in the given timezone.
 */
export function formatDateKeyInTimezone(date: Date, timezone: string = DEFAULT_BRANCH_TIMEZONE): string {
  const zoned = toZonedTime(date, timezone);
  return format(zoned, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD filter string into a UTC Date at start or end of day in the given timezone.
 */
export function parseDateBoundaryInTimezone(
  dateStr: string | undefined,
  endOfDayFlag: boolean,
  timezone: string = DEFAULT_BRANCH_TIMEZONE
): Date | undefined {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return undefined;
  }
  const suffix = endOfDayFlag ? '23:59:59.999' : '00:00:00.000';
  const parsed = fromZonedTime(`${dateStr}T${suffix}`, timezone);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Builds a continuous day-by-day series from the 1st of the current month up to `referenceDate`
 * in the target timezone, filling days with no revenue as 0.
 */
export function buildMonthDailySeries(
  referenceDate: Date,
  timezone: string,
  amountByDate: Map<string, number>
): { date: string; amount: number }[] {
  const zoned = toZonedTime(referenceDate, timezone);
  const year = zoned.getFullYear();
  const month = zoned.getMonth() + 1;
  const currentDay = zoned.getDate();

  const series: { date: string; amount: number }[] = [];
  for (let day = 1; day <= currentDay; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    series.push({
      date: dateKey,
      amount: amountByDate.get(dateKey) ?? 0,
    });
  }
  return series;
}
