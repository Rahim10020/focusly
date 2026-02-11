/**
 * @fileoverview Date conversion utilities.
 * Provides functions for converting between timestamps and ISO strings.
 * @module lib/utils/conversion-helpers
 */

/**
 * Type for dates that can be either timestamp or ISO string
 */
export type DateInput = number | string;

/**
 * Converts an ISO date string to a Unix timestamp (milliseconds).
 *
 * @param isoString - ISO 8601 date string from database
 * @returns Unix timestamp in milliseconds
 *
 * @example
 * const timestamp = toTimestamp('2024-01-15T10:30:00Z');
 * // Returns: 1705318200000
 */
export const toTimestamp = (isoString: string): number => {
    return new Date(isoString).getTime();
};

/**
 * Converts a Unix timestamp to an ISO date string for database storage.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns ISO 8601 date string
 *
 * @example
 * const isoString = toISOString(1705318200000);
 * // Returns: "2024-01-15T10:30:00.000Z"
 */
export const toISOString = (timestamp: number): string => {
    return new Date(timestamp).toISOString();
};

/**
 * Gets the current time as a Unix timestamp (milliseconds).
 *
 * @returns Current Unix timestamp in milliseconds
 *
 * @example
 * const now = nowTimestamp();
 * // Returns: 1705318200000
 */
export const nowTimestamp = (): number => {
    return Date.now();
};

/**
 * Gets the current time as an ISO string for database storage.
 *
 * @returns Current time as ISO 8601 string
 *
 * @example
 * const nowISO = nowISOString();
 * // Returns: "2024-01-15T10:30:00.000Z"
 */
export const nowISOString = (): string => {
    return new Date().toISOString();
};
