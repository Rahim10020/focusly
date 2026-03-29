/**
 * @fileoverview Date calculation utilities.
 * Provides functions for date arithmetic and day boundaries.
 * @module lib/utils/date-calculation-helpers
 */

import { toTimestamp, DateInput } from "./conversion-helpers";
import { TIME_MS } from "@/constants";

/**
 * Gets the start of day (00:00:00) for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at start of day
 *
 * @example
 * const startOfDay = startOfDay();
 * // Returns timestamp for today at 00:00:00
 */
export const startOfDay = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Gets the end of day (23:59:59.999) for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at end of day
 *
 * @example
 * const endOfDay = endOfDay();
 * // Returns timestamp for today at 23:59:59.999
 */
export const endOfDay = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

/**
 * Adds days to a date.
 *
 * @param date - Starting date (timestamp or ISO string)
 * @param days - Number of days to add (can be negative)
 * @returns New timestamp
 *
 * @example
 * const tomorrow = addDays(Date.now(), 1);
 * const yesterday = addDays(Date.now(), -1);
 */
export const addDays = (date: DateInput, days: number): number => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  return timestamp + days * TIME_MS.DAY;
};

/**
 * Adds hours to a date.
 *
 * @param date - Starting date (timestamp or ISO string)
 * @param hours - Number of hours to add (can be negative)
 * @returns New timestamp
 *
 * @example
 * const later = addHours(Date.now(), 2);
 */
export const addHours = (date: DateInput, hours: number): number => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  return timestamp + hours * TIME_MS.HOUR;
};

/**
 * Adds minutes to a date.
 *
 * @param date - Starting date (timestamp or ISO string)
 * @param minutes - Number of minutes to add (can be negative)
 * @returns New timestamp
 *
 * @example
 * const later = addMinutes(Date.now(), 30);
 */
export const addMinutes = (date: DateInput, minutes: number): number => {
  const timestamp = typeof date === "string" ? toTimestamp(date) : date;
  return timestamp + minutes * TIME_MS.MINUTE;
};

/**
 * Gets the start of week (Sunday) for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at start of week
 */
export const startOfWeek = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Gets the end of week (Saturday) for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at end of week
 */
export const endOfWeek = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

/**
 * Gets the start of month for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at start of month
 */
export const startOfMonth = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/**
 * Gets the end of month for a given date.
 *
 * @param date - Date (timestamp or ISO string, defaults to now)
 * @returns Timestamp at end of month
 */
export const endOfMonth = (date?: DateInput): number => {
  const timestamp = date
    ? typeof date === "string"
      ? toTimestamp(date)
      : date
    : Date.now();
  const d = new Date(timestamp);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};
