/**
 * @fileoverview Date utility functions for consistent date handling.
 * Provides standardized conversions between timestamps and ISO strings.
 * Includes timezone-aware formatting and user timezone detection.
 *
 * This module re-exports functions from specialized modules for backward compatibility.
 * Import directly from specific modules for better tree-shaking.
 *
 * @module lib/utils/dateUtils
 */

// Conversion utilities
export {
    toTimestamp,
    toISOString,
    nowTimestamp,
    nowISOString,
    type DateInput
} from './date/conversion-helpers';

// Date comparison utilities
export {
    isPastDate,
    isFutureDate,
    isTodayDate,
    diffInDays,
    isDateInRange
} from './date/date-comparison-helpers';

// Date calculation utilities
export {
    startOfDay,
    endOfDay,
    addDays,
    addHours,
    addMinutes,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth
} from './date/date-calculation-helpers';

// Date formatting utilities
export {
    formatDate,
    relativeTime,
    isValidISO,
    formatShortDate,
    formatLongDate,
    formatTime,
    formatDateTime
} from './date/date-formatting-helpers';

// Timezone utilities
export {
    getUserTimezone,
    formatInTimezone,
    convertTimezone,
    getTimezoneOffset,
    isDaylightSavingTime,
    getCommonTimezones
} from './date/timezone-helpers';

// Re-export dateUtils object for backward compatibility
import { toTimestamp, toISOString, nowTimestamp, nowISOString } from './date/conversion-helpers';
import { isPastDate, isFutureDate, isTodayDate, diffInDays } from './date/date-comparison-helpers';
import { startOfDay, endOfDay, addDays } from './date/date-calculation-helpers';
import { formatDate, relativeTime, isValidISO } from './date/date-formatting-helpers';
import { getUserTimezone, formatInTimezone, convertTimezone, getTimezoneOffset, isDaylightSavingTime } from './date/timezone-helpers';

/**
 * Date utilities object for backward compatibility.
 * Use direct imports for better tree-shaking.
 */
export const dateUtils = {
    toTimestamp,
    toISOString,
    now: nowTimestamp,
    nowISO: nowISOString,
    isPast: isPastDate,
    isFuture: isFutureDate,
    isToday: isTodayDate,
    startOfDay,
    endOfDay,
    addDays,
    diffInDays,
    format: formatDate,
    relative: relativeTime,
    isValidISO,
    getUserTimezone,
    formatInUserTZ: formatInTimezone,
    convertTimezone,
    getTimezoneOffset,
    isDaylightSavingTime
};
