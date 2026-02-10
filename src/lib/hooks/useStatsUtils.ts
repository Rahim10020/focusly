/**
 * @fileoverview Stats utility functions.
 */

import { PomodoroSession } from '@/types';
import { startOfDay, differenceInCalendarDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Get today's sessions from all sessions
 */
export const getTodaySessions = (sessions: PomodoroSession[]): PomodoroSession[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return sessions.filter(
    (session) => session.startedAt >= todayTimestamp && session.completed
  );
};

/**
 * Get total focus time for today in seconds
 */
export const getTodayFocusTime = (sessions: PomodoroSession[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return sessions
    .filter(
      (session) =>
        session.completed &&
        session.type === 'work' &&
        session.startedAt >= todayTimestamp
    )
    .reduce((total, session) => total + session.duration, 0);
};

/**
 * Calculate streak from sessions
 */
export const calculateStreak = (sessions: PomodoroSession[]): number => {
  if (sessions.length === 0) return 0;

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const workSessions = sessions
    .filter((s) => s.completed && s.type === 'work' && s.startedAt)
    .map((s) => {
      const utcDate = new Date(s.startedAt);
      return toZonedTime(utcDate, userTimezone);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  if (workSessions.length === 0) return 0;

  const today = startOfDay(toZonedTime(new Date(), userTimezone));
  const mostRecentSession = startOfDay(workSessions[0]);

  const daysDiff = differenceInCalendarDays(today, mostRecentSession);
  if (daysDiff > 1) return 0;

  let streak = 0;
  let currentDay = mostRecentSession;

  for (const sessionDate of workSessions) {
    const sessionDay = startOfDay(sessionDate);
    const diff = differenceInCalendarDays(currentDay, sessionDay);

    if (diff === 0) {
      continue;
    } else if (diff === 1) {
      streak++;
      currentDay = sessionDay;
    } else {
      break;
    }
  }

  return streak + 1;
};
