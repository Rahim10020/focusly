/**
 * @fileoverview Service for managing user streaks with timezone support.
 * Provides accurate streak calculation based on user's local timezone.
 */

import { addDays } from 'date-fns';

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
     * Format date as YYYY-MM-DD in user's timezone
     */
    static formatDateInUserTimezone(date: Date): string {
        const formatter = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: this.getUserTimezone()
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
        // Parse the date string and create a date at midnight UTC
        const [year, month, day] = dateString.split('-');
        return new Date(`${year}-${month}-${day}T00:00:00Z`);
    }

    /**
     * Calculate streak from sessions with timezone awareness
     */
    static calculateStreak(sessions: Session[]): StreakData {
        if (!sessions.length) {
            return { current: 0, longest: 0, lastActiveDate: null };
        }

        // Group sessions by day (in user timezone)
        const sessionsByDay = new Map<string, Session[]>();

        sessions.forEach(session => {
            const dayKey = this.formatDateInUserTimezone(new Date(session.completed_at));

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

        // Calculate current streak
        let currentStreak = 0;
        const today = this.getTodayInUserTimezone();
        let checkDate = today;
        let dayIndex = 0;

        while (dayIndex < sortedDays.length && sortedDays[dayIndex] === checkDate) {
            currentStreak++;
            dayIndex++;

            // Move to previous day
            const prevDate = addDays(new Date(checkDate), -1);
            checkDate = this.formatDateInUserTimezone(prevDate);
        }

        // Calculate longest streak
        let longestStreak = 0;
        let tempStreak = 1;

        for (let i = 0; i < sortedDays.length; i++) {
            if (i === 0) {
                tempStreak = 1;
                longestStreak = 1;
            } else {
                const currentDay = new Date(sortedDays[i]);
                const previousDay = new Date(sortedDays[i - 1]);

                // Check if days are consecutive (differ by 1 day)
                const diffTime = previousDay.getTime() - currentDay.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (Math.abs(diffDays - 1) < 0.1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }

                longestStreak = Math.max(longestStreak, tempStreak);
            }
        }

        return {
            current: currentStreak,
            longest: longestStreak,
            lastActiveDate: sortedDays[0] ? new Date(sortedDays[0]) : null
        };
    }
}
