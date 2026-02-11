/**
 * @fileoverview Leaderboard types
 */

/**
 * Represents a user in the leaderboard with their stats.
 */
export interface LeaderboardUser {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  username: string | null;
  /** URL to user's avatar image */
  avatar_url: string | null;
  /** User's productivity statistics */
  stats: {
    total_sessions: number;
    completed_tasks: number;
    total_tasks: number;
    streak: number;
    total_focus_time: number;
    longest_streak: number;
  } | null;
}

/**
 * API response structure for leaderboard data.
 */
export interface LeaderboardResponse {
  /** Array of leaderboard users */
  data: LeaderboardUser[];
  /** Pagination information */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
