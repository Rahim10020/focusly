/**
 * @fileoverview Stats utility functions.
 */

import { PomodoroSession } from "@/types";
import { StreakService } from "@/lib/services/streakService";

/**
 * Get today's sessions from all sessions
 */
export const getTodaySessions = (
  sessions: PomodoroSession[],
): PomodoroSession[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return sessions.filter(
    (session) => session.startedAt >= todayTimestamp && session.completed,
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
        session.type === "work" &&
        session.startedAt >= todayTimestamp,
    )
    .reduce((total, session) => total + session.duration, 0);
};

/**
 * Calculate streak from sessions
 */
export const calculateStreak = (sessions: PomodoroSession[]): number => {
  if (sessions.length === 0) return 0;

  const streakSessions = sessions
    .filter((session) => session.completed && session.type === "work")
    .map((session) => ({
      id: session.id,
      user_id: "local-user",
      completed_at: new Date(
        session.completedAt ?? session.startedAt,
      ).toISOString(),
      duration: session.duration,
      type: session.type,
      completed: session.completed,
    }));

  return StreakService.calculateStreak(streakSessions).current;
};
