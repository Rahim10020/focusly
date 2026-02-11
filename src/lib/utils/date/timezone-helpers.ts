/**
 * @fileoverview Timezone utilities.
 * Provides functions for timezone detection, formatting, and conversion.
 * @module lib/utils/timezone-helpers
 */

import { formatInTimeZone } from 'date-fns-tz';
import { toTimestamp, DateInput } from './conversion-helpers';

/**
 * Gets the user's timezone from browser or system settings.
 * Falls back to 'UTC' if timezone cannot be determined.
 *
 * @returns User's timezone string (IANA timezone identifier)
 *
 * @example
 * const tz = getUserTimezone();
 * // Returns: "America/New_York" or "Europe/Paris" or "UTC"
 */
export const getUserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
        return 'UTC';
    }
};

/**
 * Formats a date in the user's timezone with a custom format.
 * Uses date-fns-tz for accurate timezone handling.
 *
 * @param date - Date to format (timestamp or ISO string)
 * @param formatStr - Format string (date-fns format tokens)
 * @param timezone - Optional timezone override (defaults to user's timezone)
 * @returns Formatted date string in the specified timezone
 *
 * @example
 * const formatted = formatInTimezone(Date.now(), 'yyyy-MM-dd HH:mm:ss zzz');
 * // Returns: "2024-01-15 10:30:00 EST"
 *
 * @example
 * // With specific timezone
 * const tokyo = formatInTimezone(Date.now(), 'PPpp', 'Asia/Tokyo');
 * // Returns: "Jan 15, 2024, 11:30:00 PM"
 */
export const formatInTimezone = (
    date: DateInput,
    formatStr: string = 'yyyy-MM-dd HH:mm:ss zzz',
    timezone?: string
): string => {
    const timestamp = typeof date === 'string' ? toTimestamp(date) : date;
    const tz = timezone || getUserTimezone();

    try {
        return formatInTimeZone(new Date(timestamp), tz, formatStr);
    } catch (error) {
        // Fallback to regular format if timezone formatting fails
        console.error('Error formatting in timezone:', error);
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }).format(new Date(timestamp));
    }
};

/**
 * Converts a date from one timezone to another.
 * Returns the equivalent timestamp in the target timezone.
 *
 * @param date - Date to convert (timestamp or ISO string)
 * @param fromTimezone - Source timezone (IANA identifier)
 * @param toTimezone - Target timezone (IANA identifier)
 * @returns Timestamp in target timezone
 *
 * @example
 * const nyTime = Date.now(); // Current time in New York
 * const tokyoTime = convertTimezone(nyTime, 'America/New_York', 'Asia/Tokyo');
 */
export const convertTimezone = (
    date: DateInput,
    fromTimezone: string,
    toTimezone: string
): number => {
    const timestamp = typeof date === 'string' ? toTimestamp(date) : date;

    // Create date strings in both timezones
    const fromStr = formatInTimeZone(new Date(timestamp), fromTimezone, "yyyy-MM-dd'T'HH:mm:ss");
    const toStr = formatInTimeZone(new Date(timestamp), toTimezone, "yyyy-MM-dd'T'HH:mm:ss");

    // Calculate the offset difference
    const fromTime = new Date(fromStr).getTime();
    const toTime = new Date(toStr).getTime();
    const offset = toTime - fromTime;

    return timestamp + offset;
};

/**
 * Gets the timezone offset in minutes for a specific timezone.
 *
 * @param timezone - Timezone to get offset for (IANA identifier)
 * @param date - Optional date to check offset at (defaults to now)
 * @returns Offset in minutes
 *
 * @example
 * const offset = getTimezoneOffset('America/New_York');
 * // Returns: -300 (for EST, which is UTC-5)
 */
export const getTimezoneOffset = (timezone: string, date?: DateInput): number => {
    const timestamp = date
        ? (typeof date === 'string' ? toTimestamp(date) : date)
        : Date.now();

    const utcDate = new Date(timestamp);
    const tzDate = new Date(formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ss"));

    return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
};

/**
 * Checks if a timezone observes daylight saving time at a given date.
 *
 * @param timezone - Timezone to check (IANA identifier)
 * @param date - Optional date to check at (defaults to now)
 * @returns true if DST is in effect
 *
 * @example
 * const isDST = isDaylightSavingTime('America/New_York', Date.now());
 */
export const isDaylightSavingTime = (timezone: string, date?: DateInput): boolean => {
    const timestamp = date
        ? (typeof date === 'string' ? toTimestamp(date) : date)
        : Date.now();

    // Get offset in January (winter) and July (summer)
    const jan = new Date(new Date(timestamp).getFullYear(), 0, 1);
    const jul = new Date(new Date(timestamp).getFullYear(), 6, 1);

    const janOffset = getTimezoneOffset(timezone, jan.getTime());
    const julOffset = getTimezoneOffset(timezone, jul.getTime());
    const currentOffset = getTimezoneOffset(timezone, timestamp);

    const dstOffset = Math.max(janOffset, julOffset);
    return currentOffset === dstOffset;
};

/**
 * Gets a list of common timezones.
 *
 * @returns Array of timezone strings
 */
export const getCommonTimezones = (): string[] => {
    return [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Australia/Sydney',
        'Pacific/Auckland'
    ];
};
