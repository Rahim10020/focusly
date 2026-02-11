/**
 * @fileoverview Date formatting utilities.
 * Provides functions for formatting dates for display.
 * @module lib/utils/date-formatting-helpers
 */

import { toTimestamp, DateInput } from './conversion-helpers';

/**
 * Formats a date for display (locale-aware).
 *
 * @param date - Date to format (timestamp or ISO string)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 *
 * @example
 * const formatted = formatDate(Date.now(), {
 *   dateStyle: 'medium',
 *   timeStyle: 'short'
 * });
 * // Returns: "Jan 15, 2024, 10:30 AM"
 */
export const formatDate = (
    date: DateInput,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string => {
    const timestamp = typeof date === 'string' ? toTimestamp(date) : date;
    return new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
};

/**
 * Gets a relative time string (e.g., "2 hours ago", "in 3 days").
 *
 * @param date - Date to compare (timestamp or ISO string)
 * @returns Relative time string
 *
 * @example
 * const relative = relativeTime(Date.now() - 3600000);
 * // Returns: "1 hour ago"
 */
export const relativeTime = (date: DateInput): string => {
    const timestamp = typeof date === 'string' ? toTimestamp(date) : date;
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 0) {
        const future = Math.abs(diffSec);
        if (future < 60) return 'in a few seconds';
        if (future < 60) return `in ${future} seconds`;
        if (future < 3600) return `in ${Math.floor(future / 60)} minutes`;
        if (future < 86400) return `in ${Math.floor(future / 3600)} hours`;
        if (future < 604800) return `in ${Math.floor(future / 86400)} days`;
        if (future < 2592000) return `in ${Math.floor(future / 604800)} weeks`;
        if (future < 31536000) return `in ${Math.floor(future / 2592000)} months`;
        return `in ${Math.floor(future / 31536000)} years`;
    }

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) !== 1 ? 's' : ''} ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDay / 365)} year${Math.floor(diffDay / 365) !== 1 ? 's' : ''} ago`;
};

/**
 * Validates if a string is a valid ISO date.
 *
 * @param dateString - String to validate
 * @returns true if valid ISO date
 *
 * @example
 * const isValid = isValidISO('2024-01-15T10:30:00Z');
 * // Returns: true
 */
export const isValidISO = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date.toISOString() === dateString;
};

/**
 * Formats a date to a short format (e.g., "Jan 15, 2024").
 *
 * @param date - Date to format
 * @returns Short formatted date string
 */
export const formatShortDate = (date: DateInput): string => {
    return formatDate(date, { dateStyle: 'short' });
};

/**
 * Formats a date to a long format (e.g., "January 15, 2024").
 *
 * @param date - Date to format
 * @returns Long formatted date string
 */
export const formatLongDate = (date: DateInput): string => {
    return formatDate(date, { dateStyle: 'long' });
};

/**
 * Formats time only (e.g., "10:30 AM").
 *
 * @param date - Date to format
 * @returns Time string
 */
export const formatTime = (date: DateInput): string => {
    return formatDate(date, { timeStyle: 'short' });
};

/**
 * Formats a date with time (e.g., "Jan 15, 2024, 10:30 AM").
 *
 * @param date - Date to format
 * @returns Date and time string
 */
export const formatDateTime = (date: DateInput): string => {
    return formatDate(date, { dateStyle: 'medium', timeStyle: 'short' });
};
