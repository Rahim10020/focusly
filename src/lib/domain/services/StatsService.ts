/**
 * @fileoverview Centralized Statistics Business Logic Service
 * Consolidates all stats-related calculations and operations.
 *
 * Replaces logic from:
 * - useStats, useStatsAction, useStatsStorage, useStatsUtils
 * - StreakService
 * - stats-calculations.ts
 */

import { PomodoroSession, Stats } from "@/types";
import { DateTimeService } from "./DateTimeService";
import { TIME_SECONDS } from "@/lib/constants";
import { addDays } from "date-fns";

/**
 * Streak information with current and longest streaks
 */
export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: Date | null;
}

/**
 * Centralized Statistics Service
 * All stats and productivity calculations in one place
 */
export class StatsService {
  /**
   * Get all sessions from today
   */
  static getTodaySessions(sessions: PomodoroSession[]): PomodoroSession[] {
    const todayStart = DateTimeService.getStartOfDayInUserTimezone();
    const todayEnd = DateTimeService.getEndOfDayInUserTimezone();
    const todayStart_ms = todayStart.getTime();
    const todayEnd_ms = todayEnd.getTime();

    return sessions.filter(
      (session) =>
        session.startedAt >= todayStart_ms &&
        session.startedAt <= todayEnd_ms &&
        session.completed,
    );
  }

  /**
   * Get total focus time for today in seconds
   */
  static getTodayFocusTime(sessions: PomodoroSession[]): number {
    return this.getTodaySessions(sessions)
      .filter((session) => session.type === "work")
      .reduce((total, session) => total + session.duration, 0);
  }

  /**
   * Calculate current and longest streaks from sessions
   */
  static calculateStreak(sessions: PomodoroSession[]): StreakData {
    if (!sessions.length) {
      return { current: 0, longest: 0, lastActiveDate: null };
    }

    // Group sessions by day (in user timezone)
    const sessionsByDay = new Map<string, PomodoroSession[]>();

    sessions.forEach((session) => {
      const dayKey = DateTimeService.formatDateInUserTimezone(
        new Date(session.startedAt),
      );

      if (!sessionsByDay.has(dayKey)) {
        sessionsByDay.set(dayKey, []);
      }
      sessionsByDay.get(dayKey)!.push(session);
    });

    // Sort dates in descending order
    const sortedDays = Array.from(sessionsByDay.keys()).sort().reverse();

    if (sortedDays.length === 0) {
      return { current: 0, longest: 0, lastActiveDate: null };
    }

    const today = DateTimeService.getTodayInUserTimezone();
    const yesterday = DateTimeService.formatDateInUserTimezone(
      addDays(new Date(), -1),
    );

    // No active streak if the latest activity is older than yesterday
    if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
      return {
        current: 0,
        longest: this.calculateLongestStreak(sortedDays),
        lastActiveDate: new Date(sortedDays[0]),
      };
    }

    // Calculate current streak from the latest active day
    let currentStreak = 0;
    let checkDate = sortedDays[0];
    let dayIndex = 0;

    while (dayIndex < sortedDays.length && sortedDays[dayIndex] === checkDate) {
      currentStreak++;
      dayIndex++;
      checkDate = DateTimeService.formatDateInUserTimezone(
        addDays(new Date(checkDate), -1),
      );
    }

    return {
      current: currentStreak,
      longest: Math.max(currentStreak, this.calculateLongestStreak(sortedDays)),
      lastActiveDate: new Date(sortedDays[0]),
    };
  }

  /**
   * Find the longest consecutive streak in a sorted list of dates
   */
  private static calculateLongestStreak(sortedDays: string[]): number {
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const currentDate = new Date(sortedDays[i - 1]);
      const previousDate = new Date(sortedDays[i]);
      const dayDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (dayDiff === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }

  /**
   * Calculate total sessions completed today
   */
  static getTodaySessionCount(sessions: PomodoroSession[]): number {
    return this.getTodaySessions(sessions).length;
  }

  /**
   * Get total focus hours from all sessions
   */
  static getTotalFocusHours(sessions: PomodoroSession[]): number {
    const totalSeconds = sessions
      .filter((s) => s.completed && s.type === "work")
      .reduce((total, s) => total + s.duration, 0);
    return DateTimeService.secondsToHours(totalSeconds);
  }

  /**
   * Get average session duration in minutes
   */
  static getAverageSessionDuration(sessions: PomodoroSession[]): number {
    if (!sessions.length) return 0;
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    return Math.round(totalDuration / sessions.length / TIME_SECONDS.MINUTE);
  }

  /**
   * Refresh stats object with new calculations
   */
  static refreshStats(
    stats: Stats,
    sessions: PomodoroSession[],
    totalTasks: number,
    completedTasks: number,
  ): Stats {
    const streak = this.calculateStreak(sessions);
    const todayFocusTime = this.getTodayFocusTime(sessions);
    const todaySessionCount = this.getTodaySessionCount(sessions);

    return {
      ...stats,
      totalFocusTime: sessions
        .filter((s) => s.completed && s.type === "work")
        .reduce((total, s) => total + s.duration, 0),
      totalSessions: sessions.filter((s) => s.completed).length,
      totalTasks,
      completedTasks,
      streak: streak.current,
      longestStreak: streak.longest,
    };
  }

  /**
   * Get productivity metrics for a date range
   */
  static getProductivityMetrics(
    sessions: PomodoroSession[],
    startDate: Date,
    endDate: Date,
  ) {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();

    const sessionsInRange = sessions.filter(
      (s) => s.startedAt >= startMs && s.startedAt <= endMs && s.completed,
    );

    return {
      sessionCount: sessionsInRange.length,
      totalFocusTime: sessionsInRange
        .filter((s) => s.type === "work")
        .reduce((total, s) => total + s.duration, 0),
      breakTime: sessionsInRange
        .filter((s) => s.type === "break")
        .reduce((total, s) => total + s.duration, 0),
    };
  }
}
