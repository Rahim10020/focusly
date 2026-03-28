/**
 * @fileoverview Centralized Date & Time Business Logic Service
 * Consolidates all date/time calculations across the application with timezone awareness.
 *
 * This service replaces scattered logic in:
 * - src/lib/utils/date/* files
 * - StreakService
 * - useStatsUtils
 */

import { TIME_MS, TIME_SECONDS } from "@/lib/constants";
import {
  addDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
} from "date-fns";

/**
 * Centralized Date & Time Service
 * Provides timezone-aware date calculations and utilities
 */
export class DateTimeService {
  /**
   * Get user's timezone from settings or browser
   */
  static getUserTimezone(): string {
    if (typeof window !== "undefined") {
      const savedTimezone = localStorage.getItem("userTimezone");
      if (savedTimezone) return savedTimezone;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Format date as YYYY-MM-DD in user's timezone
   */
  static formatDateInUserTimezone(date: Date): string {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: this.getUserTimezone(),
    });
    return formatter.format(date);
  }

  /**
   * Get today's date as YYYY-MM-DD string in user's timezone
   */
  static getTodayInUserTimezone(): string {
    return this.formatDateInUserTimezone(new Date());
  }

  /**
   * Get start of day in user's timezone as a Date object
   */
  static getStartOfDayInUserTimezone(date?: Date): Date {
    const targetDate = date || new Date();
    const dateString = this.formatDateInUserTimezone(targetDate);
    const [year, month, day] = dateString.split("-");
    return new Date(`${year}-${month}-${day}T00:00:00Z`);
  }

  /**
   * Get end of day in user's timezone
   */
  static getEndOfDayInUserTimezone(date?: Date): Date {
    const startOfDayDate = this.getStartOfDayInUserTimezone(date);
    return new Date(startOfDayDate.getTime() + TIME_MS.DAY - 1);
  }

  /**
   * Check if a timestamp is today (in user's timezone)
   */
  static isToday(timestamp: number): boolean {
    const date = new Date(timestamp);
    return (
      this.formatDateInUserTimezone(date) === this.getTodayInUserTimezone()
    );
  }

  /**
   * Check if a timestamp is yesterday
   */
  static isYesterday(timestamp: number): boolean {
    const date = new Date(timestamp);
    const yesterday = addDays(new Date(), -1);
    return (
      this.formatDateInUserTimezone(date) ===
      this.formatDateInUserTimezone(yesterday)
    );
  }

  /**
   * Get start of current week
   */
  static getStartOfWeek(date?: Date): Date {
    return startOfWeek(date || new Date());
  }

  /**
   * Get end of current week
   */
  static getEndOfWeek(date?: Date): Date {
    return endOfWeek(date || new Date());
  }

  /**
   * Get start of current month
   */
  static getStartOfMonth(date?: Date): Date {
    return startOfMonth(date || new Date());
  }

  /**
   * Get end of current month
   */
  static getEndOfMonth(date?: Date): Date {
    return endOfMonth(date || new Date());
  }

  /**
   * Get number of days between two dates
   */
  static getDaysBetween(startDate: Date, endDate: Date): number {
    return Math.abs(differenceInDays(endDate, startDate));
  }

  /**
   * Add days to a date
   */
  static addDaysToDate(date: Date, days: number): Date {
    return addDays(date, days);
  }

  /**
   * Formatted duration from seconds (e.g., "2h 30m")
   */
  static formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / TIME_SECONDS.HOUR);
    const minutes = Math.floor(
      (totalSeconds % TIME_SECONDS.HOUR) / TIME_SECONDS.MINUTE,
    );
    return `${hours}h ${minutes}m`;
  }

  /**
   * Convert seconds to hours
   */
  static secondsToHours(seconds: number): number {
    return Math.round(seconds / TIME_SECONDS.HOUR);
  }

  /**
   * Convert milliseconds to seconds
   */
  static msToSeconds(ms: number): number {
    return Math.floor(ms / TIME_MS.SECOND);
  }

  /**
   * Convert seconds to milliseconds
   */
  static secondsToMs(seconds: number): number {
    return seconds * TIME_MS.SECOND;
  }
}
