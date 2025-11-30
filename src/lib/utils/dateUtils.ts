/**
 * @fileoverview Date utility functions for consistent date handling.
 * Provides standardized conversions between timestamps and ISO strings.
 * Includes timezone-aware formatting and user timezone detection.
 * 
 * @module lib/utils/dateUtils
 */

import { formatInTimeZone } from 'date-fns-tz';

/**
 * Date utilities for consistent date handling across the application.
 * Use these functions instead of direct Date conversions to ensure consistency.
 */
export const dateUtils = {
    /**
     * Converts an ISO date string to a Unix timestamp (milliseconds).
     * 
     * @param isoString - ISO 8601 date string from database
     * @returns Unix timestamp in milliseconds
     * 
     * @example
     * const timestamp = dateUtils.toTimestamp('2024-01-15T10:30:00Z');
     * // Returns: 1705318200000
     */
    toTimestamp: (isoString: string): number => {
        return new Date(isoString).getTime();
    },

    /**
     * Converts a Unix timestamp to an ISO date string for database storage.
     * 
     * @param timestamp - Unix timestamp in milliseconds
     * @returns ISO 8601 date string
     * 
     * @example
     * const isoString = dateUtils.toISOString(1705318200000);
     * // Returns: "2024-01-15T10:30:00.000Z"
     */
    toISOString: (timestamp: number): string => {
        return new Date(timestamp).toISOString();
    },

    /**
     * Gets the current time as a Unix timestamp (milliseconds).
     * 
     * @returns Current Unix timestamp in milliseconds
     * 
     * @example
     * const now = dateUtils.now();
     * // Returns: 1705318200000
     */
    now: (): number => {
        return Date.now();
    },

    /**
     * Gets the current time as an ISO string for database storage.
     * 
     * @returns Current time as ISO 8601 string
     * 
     * @example
     * const nowISO = dateUtils.nowISO();
     * // Returns: "2024-01-15T10:30:00.000Z"
     */
    nowISO: (): string => {
        return new Date().toISOString();
    },

    /**
     * Checks if a date is in the past.
     * 
     * @param date - Date to check (timestamp or ISO string)
     * @returns true if date is in the past
     * 
     * @example
     * const isPast = dateUtils.isPast('2024-01-01T00:00:00Z');
     * // Returns: true (if current date is after 2024-01-01)
     */
    isPast: (date: number | string): boolean => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        return timestamp < Date.now();
    },

    /**
     * Checks if a date is in the future.
     * 
     * @param date - Date to check (timestamp or ISO string)
     * @returns true if date is in the future
     * 
     * @example
     * const isFuture = dateUtils.isFuture('2025-12-31T23:59:59Z');
     * // Returns: true (if current date is before 2025-12-31)
     */
    isFuture: (date: number | string): boolean => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        return timestamp > Date.now();
    },

    /**
     * Checks if a date is today.
     * 
     * @param date - Date to check (timestamp or ISO string)
     * @returns true if date is today
     * 
     * @example
     * const isToday = dateUtils.isToday(Date.now());
     * // Returns: true
     */
    isToday: (date: number | string): boolean => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        const checkDate = new Date(timestamp);
        const today = new Date();

        return (
            checkDate.getDate() === today.getDate() &&
            checkDate.getMonth() === today.getMonth() &&
            checkDate.getFullYear() === today.getFullYear()
        );
    },

    /**
     * Gets the start of day (00:00:00) for a given date.
     * 
     * @param date - Date (timestamp or ISO string, defaults to now)
     * @returns Timestamp at start of day
     * 
     * @example
     * const startOfDay = dateUtils.startOfDay();
     * // Returns timestamp for today at 00:00:00
     */
    startOfDay: (date?: number | string): number => {
        const timestamp = date
            ? (typeof date === 'string' ? dateUtils.toTimestamp(date) : date)
            : Date.now();
        const d = new Date(timestamp);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    },

    /**
     * Gets the end of day (23:59:59.999) for a given date.
     * 
     * @param date - Date (timestamp or ISO string, defaults to now)
     * @returns Timestamp at end of day
     * 
     * @example
     * const endOfDay = dateUtils.endOfDay();
     * // Returns timestamp for today at 23:59:59.999
     */
    endOfDay: (date?: number | string): number => {
        const timestamp = date
            ? (typeof date === 'string' ? dateUtils.toTimestamp(date) : date)
            : Date.now();
        const d = new Date(timestamp);
        d.setHours(23, 59, 59, 999);
        return d.getTime();
    },

    /**
     * Adds days to a date.
     * 
     * @param date - Starting date (timestamp or ISO string)
     * @param days - Number of days to add (can be negative)
     * @returns New timestamp
     * 
     * @example
     * const tomorrow = dateUtils.addDays(Date.now(), 1);
     * const yesterday = dateUtils.addDays(Date.now(), -1);
     */
    addDays: (date: number | string, days: number): number => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        return timestamp + (days * 24 * 60 * 60 * 1000);
    },

    /**
     * Calculates the difference in days between two dates.
     * 
     * @param date1 - First date (timestamp or ISO string)
     * @param date2 - Second date (timestamp or ISO string)
     * @returns Number of days between dates (can be negative)
     * 
     * @example
     * const daysDiff = dateUtils.diffInDays('2024-01-15', '2024-01-10');
     * // Returns: 5
     */
    diffInDays: (date1: number | string, date2: number | string): number => {
        const timestamp1 = typeof date1 === 'string' ? dateUtils.toTimestamp(date1) : date1;
        const timestamp2 = typeof date2 === 'string' ? dateUtils.toTimestamp(date2) : date2;
        const diffMs = timestamp1 - timestamp2;
        return Math.floor(diffMs / (24 * 60 * 60 * 1000));
    },

    /**
     * Formats a date for display (locale-aware).
     * 
     * @param date - Date to format (timestamp or ISO string)
     * @param options - Intl.DateTimeFormatOptions
     * @returns Formatted date string
     * 
     * @example
     * const formatted = dateUtils.format(Date.now(), { 
     *   dateStyle: 'medium',
     *   timeStyle: 'short'
     * });
     * // Returns: "Jan 15, 2024, 10:30 AM"
     */
    format: (
        date: number | string,
        options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
    ): string => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        return new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
    },

    /**
     * Gets a relative time string (e.g., "2 hours ago", "in 3 days").
     * 
     * @param date - Date to compare (timestamp or ISO string)
     * @returns Relative time string
     * 
     * @example
     * const relative = dateUtils.relative(Date.now() - 3600000);
     * // Returns: "1 hour ago"
     */
    relative: (date: number | string): string => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        const now = Date.now();
        const diffMs = now - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
        if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
        if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
        if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) !== 1 ? 's' : ''} ago`;
        return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) !== 1 ? 's' : ''} ago`;
    },

    /**
     * Validates if a string is a valid ISO date.
     * 
     * @param dateString - String to validate
     * @returns true if valid ISO date
     * 
     * @example
     * const isValid = dateUtils.isValidISO('2024-01-15T10:30:00Z');
     * // Returns: true
     */
    isValidISO: (dateString: string): boolean => {
        const date = new Date(dateString);
        return !isNaN(date.getTime()) && date.toISOString() === dateString;
    },

    /**
     * Gets the user's timezone from browser or system settings.
     * Falls back to 'UTC' if timezone cannot be determined.
     * 
     * @returns User's timezone string (IANA timezone identifier)
     * 
     * @example
     * const tz = dateUtils.getUserTimezone();
     * // Returns: "America/New_York" or "Europe/Paris" or "UTC"
     */
    getUserTimezone: (): string => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch {
            return 'UTC';
        }
    },

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
     * const formatted = dateUtils.formatInUserTZ(Date.now(), 'yyyy-MM-dd HH:mm:ss zzz');
     * // Returns: "2024-01-15 10:30:00 EST"
     * 
     * @example
     * // With specific timezone
     * const tokyo = dateUtils.formatInUserTZ(Date.now(), 'PPpp', 'Asia/Tokyo');
     * // Returns: "Jan 15, 2024, 11:30:00 PM"
     */
    formatInUserTZ: (
        date: number | string,
        formatStr: string = 'yyyy-MM-dd HH:mm:ss zzz',
        timezone?: string
    ): string => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;
        const tz = timezone || dateUtils.getUserTimezone();

        try {
            return formatInTimeZone(new Date(timestamp), tz, formatStr);
        } catch (error) {
            // Fallback to regular format if timezone formatting fails
            console.error('Error formatting in timezone:', error);
            return dateUtils.format(timestamp, { dateStyle: 'medium', timeStyle: 'medium' });
        }
    },

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
     * const tokyoTime = dateUtils.convertTimezone(nyTime, 'America/New_York', 'Asia/Tokyo');
     */
    convertTimezone: (
        date: number | string,
        fromTimezone: string,
        toTimezone: string
    ): number => {
        const timestamp = typeof date === 'string' ? dateUtils.toTimestamp(date) : date;

        // Create date strings in both timezones
        const fromStr = formatInTimeZone(new Date(timestamp), fromTimezone, "yyyy-MM-dd'T'HH:mm:ss");
        const toStr = formatInTimeZone(new Date(timestamp), toTimezone, "yyyy-MM-dd'T'HH:mm:ss");

        // Calculate the offset difference
        const fromTime = new Date(fromStr).getTime();
        const toTime = new Date(toStr).getTime();
        const offset = toTime - fromTime;

        return timestamp + offset;
    },

    /**
     * Gets the timezone offset in minutes for a specific timezone.
     * 
     * @param timezone - Timezone to get offset for (IANA identifier)
     * @param date - Optional date to check offset at (defaults to now)
     * @returns Offset in minutes
     * 
     * @example
     * const offset = dateUtils.getTimezoneOffset('America/New_York');
     * // Returns: -300 (for EST, which is UTC-5)
     */
    getTimezoneOffset: (timezone: string, date?: number | string): number => {
        const timestamp = date
            ? (typeof date === 'string' ? dateUtils.toTimestamp(date) : date)
            : Date.now();

        const utcDate = new Date(timestamp);
        const tzDate = new Date(formatInTimeZone(utcDate, timezone, "yyyy-MM-dd'T'HH:mm:ss"));

        return (tzDate.getTime() - utcDate.getTime()) / (60 * 1000);
    },

    /**
     * Checks if a timezone observes daylight saving time at a given date.
     * 
     * @param timezone - Timezone to check (IANA identifier)
     * @param date - Optional date to check at (defaults to now)
     * @returns true if DST is in effect
     * 
     * @example
     * const isDST = dateUtils.isDaylightSavingTime('America/New_York', Date.now());
     */
    isDaylightSavingTime: (timezone: string, date?: number | string): boolean => {
        const timestamp = date
            ? (typeof date === 'string' ? dateUtils.toTimestamp(date) : date)
            : Date.now();

        // Get offset in January (winter) and July (summer)
        const jan = new Date(new Date(timestamp).getFullYear(), 0, 1);
        const jul = new Date(new Date(timestamp).getFullYear(), 6, 1);

        const janOffset = dateUtils.getTimezoneOffset(timezone, jan.getTime());
        const julOffset = dateUtils.getTimezoneOffset(timezone, jul.getTime());
        const currentOffset = dateUtils.getTimezoneOffset(timezone, timestamp);

        const dstOffset = Math.max(janOffset, julOffset);
        return currentOffset === dstOffset;
    },
};
