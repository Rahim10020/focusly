/**
 * @fileoverview Time utility functions for formatting and date comparisons.
 * Provides helper functions for displaying timer values and checking date conditions.
 * @module lib/utils/time
 */

/**
 * Formats seconds into a MM:SS string format for timer display.
 *
 * @param {number} seconds - The total number of seconds to format
 * @returns {string} Formatted time string in MM:SS format (e.g., "25:00", "05:30")
 *
 * @example
 * formatTime(1500); // Returns "25:00"
 * formatTime(90);   // Returns "01:30"
 */
export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Calculates the progress percentage of a timer.
 *
 * @param {number} timeLeft - Remaining time in seconds
 * @param {number} totalTime - Total duration in seconds
 * @returns {number} Progress percentage (0-100)
 *
 * @example
 * getProgress(300, 1500); // Returns 80 (80% complete)
 */
export function getProgress(timeLeft: number, totalTime: number): number {
    return ((totalTime - timeLeft) / totalTime) * 100;
}

/**
 * Checks if a timestamp represents today's date.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if the timestamp is today, false otherwise
 *
 * @example
 * isToday(Date.now()); // Returns true
 */
export function isToday(timestamp: number): boolean {
    const date = new Date(timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

/**
 * Checks if a timestamp represents tomorrow's date.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if the timestamp is tomorrow, false otherwise
 *
 * @example
 * const tomorrow = Date.now() + 86400000;
 * isTomorrow(tomorrow); // Returns true
 */
export function isTomorrow(timestamp: number): boolean {
    const date = new Date(timestamp);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
}

/**
 * Checks if a timestamp is in the past.
 *
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if the timestamp is before the current time
 *
 * @example
 * isPast(Date.now() - 1000); // Returns true
 */
export function isPast(timestamp: number): boolean {
    return timestamp < Date.now();
}