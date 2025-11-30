/**
 * @fileoverview Service for managing user streaks with timezone support.
 * Provides accurate streak calculation based on user's local timezone.
 */

import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { addDays, startOfDay } from 'date-fns';

export interface Session {
    id: string;
    user_id: string;
    completed_at: string;
    duration: number;
    type?: string;
    completed?: boolean;
}

export interface StreakData {
    current: number;
    longest: number;
    lastActiveDate: Date | null;
}

export class StreakService {
    /**
     * Get user's timezone from settings or browser
     */
    static getUserTimezone(): string {
        // Try to get from user settings (localStorage)
        if (typeof window !== 'undefined') {
            const savedTimezone = localStorage.getItem('userTimezone');
            if (savedTimezone) return savedTimezone;
        }

        // Otherwise use browser timezone
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    /**
     * Get today's date in user's timezone
     */
    static getTodayInUserTimezone(): Date {
        const timezone = this.getUserTimezone();
        const zonedDate = toZonedTime(new Date(), timezone);
        zonedDate.setHours(0, 0, 0, 0);
        return zonedDate;
    }

    /**
     * Get start of day in user's timezone
     */
    static getStartOfDayInUserTimezone(date?: Date): Date {
        const timezone = this.getUserTimezone();
        const targetDate = date || new Date();
        const zonedDate = toZonedTime(targetDate, timezone);
        zonedDate.setHours(0, 0, 0, 0);
        return fromZonedTime(zonedDate, timezone);
    }

    /**
     * Calculate streak from sessions with timezone awareness
     */
    static calculateStreak(sessions: Session[]): StreakData {
        if (!sessions.length) {
            return { current: 0, longest: 0, lastActiveDate: null };
        }

        const timezone = this.getUserTimezone();

        // Group sessions by day (in user timezone)
        const sessionsByDay = new Map<string, Session[]>();

        sessions.forEach(session => {
            const zonedDate = toZonedTime(new Date(session.completed_at), timezone);
            const dayKey = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

            if (!sessionsByDay.has(dayKey)) {
                sessionsByDay.set(dayKey, []);
            }
            sessionsByDay.get(dayKey)!.push(session);
        });

        // Sort dates
        const sortedDays = Array.from(sessionsByDay.keys()).sort().reverse();

        // Calculate current streak
        let currentStreak = 0;
        const today = format(this.getTodayInUserTimezone(), 'yyyy-MM-dd', {
            timeZone: timezone
        });

        let checkDate = today;
        let dayIndex = 0;

        while (dayIndex < sortedDays.length && sortedDays[dayIndex] === checkDate) {
            currentStreak++;
            dayIndex++;

            // Move to previous day
            const prevDate = addDays(new Date(checkDate), -1);
            checkDate = format(
                toZonedTime(prevDate, timezone),
                'yyyy-MM-dd',
                { timeZone: timezone }
            );
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 0;
        let expectedDate = sortedDays[0];

        for (const day of sortedDays) {
            if (day === expectedDate) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);

                // Calculate expected previous date
                const prevDate = addDays(new Date(day), -1);
                expectedDate = format(
                    toZonedTime(prevDate, timezone),
                    'yyyy-MM-dd',
                    { timeZone: timezone }
                );
            } else {
                tempStreak = 1;
                const prevDate = addDays(new Date(day), -1);
                expectedDate = format(
                    toZonedTime(prevDate, timezone),
                    'yyyy-MM-dd',
                    { timeZone: timezone }
                );
            }
        }

        return {
            current: currentStreak,
            longest: longestStreak,
            lastActiveDate: sortedDays[0] ? new Date(sortedDays[0]) : null
        };
    }
}
