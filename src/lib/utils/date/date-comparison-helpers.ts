/**
 * @fileoverview Date comparison utilities.
 * Provides functions for comparing dates and checking date ranges.
 * @module lib/utils/date-comparison-helpers
 */

import { toTimestamp } from "./conversion-helpers";
import { TIME_MS } from "@/constants";

/**
 * Type for dates that can be either timestamp or ISO string
 */
export type DateInput = number | string;

/**
 * Checks if a date is in the past.
 *
 * @param date - Date to check (timestamp or ISO string)
 * @returns true if date is in the past
 *
 * @example
 * const isPast = isPastDate('2024-01-01T00:00:00Z');
 * // Returns: true (if current date is after 2024-01-01)
 */
export const isPastDate = (date: DateInput): boolean => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  return timestamp < Date.now();
};

/**
 * Checks if a date is in the future.
 *
 * @param date - Date to check (timestamp or ISO string)
 * @returns true if date is in the future
 *
 * @example
 * const isFuture = isFutureDate('2025-12-31T23:59:59Z');
 * // Returns: true (if current date is before 2025-12-31)
 */
export const isFutureDate = (date: DateInput): boolean => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  return timestamp > Date.now();
};

/**
 * Checks if a date is today.
 *
 * @param date - Date to check (timestamp or ISO string)
 * @returns true if date is today
 *
 * @example
 * const isToday = isTodayDate(Date.now());
 * // Returns: true
 */
export const isTodayDate = (date: DateInput): boolean => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  const checkDate = new Date(timestamp);
  const today = new Date();

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Calculates the difference in days between two dates.
 *
 * @param date1 - First date (timestamp or ISO string)
 * @param date2 - Second date (timestamp or ISO string)
 * @returns Number of days between dates (can be negative)
 *
 * @example
 * const daysDiff = diffInDays('2024-01-15', '2024-01-10');
 * // Returns: 5
 */
export const diffInDays = (date1: DateInput, date2: DateInput): number => {
  const timestamp1 = typeof date1 === "string" ? toTimestamp(date1) : date1;
  const timestamp2 = typeof date2 === "string" ? toTimestamp(date2) : date2;
  const diffMs = timestamp1 - timestamp2;
  return Math.floor(diffMs / TIME_MS.DAY);
};

/**
 * Checks if a date is within a range.
 *
 * @param date - Date to check
 * @param start - Start of range
 * @param end - End of range
 * @returns true if date is within the range
 *
 * @example
 * const inRange = isDateInRange(
 *   '2024-01-15T10:00:00Z',
 *   '2024-01-01T00:00:00Z',
 *   '2024-12-31T23:59:59Z'
 * );
 * // Returns: true
 */
export const isDateInRange = (
  date: DateInput,
  start: DateInput,
  end: DateInput,
): boolean => {
  const dateTs = typeof date === "string" ? toTimestamp(date) : date;
  const startTs = typeof start === "string" ? toTimestamp(start) : start;
  const endTs = typeof end === "string" ? toTimestamp(end) : end;

  return dateTs >= startTs && dateTs <= endTs;
};
