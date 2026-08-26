import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, startOfDay, endOfDay } from 'date-fns';

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
