/**
 * @fileoverview API endpoint routes.
 * Centralized API endpoint definitions to avoid hardcoding URLs and enable easy changes.
 */

export const API_ROUTES = {
  // Friends
  FRIENDS: "/api/friends",

  // Leaderboard
  LEADERBOARD: "/api/leaderboard",

  // Notifications
  NOTIFICATIONS: "/api/notifications",

  // Users
  USERS: "/api/users",
  USER_PREFERENCES: "/api/user/preferences",

  // Tasks
  TASKS: "/api/tasks",
  TASKS_FAILED: "/api/tasks/failed",
} as const;

export const API_DYNAMIC_ROUTES = {
  // Friends
  FRIEND_BY_ID: (id: string) => `/api/friends/${id}`,

  // Notifications
  NOTIFICATION_BY_ID: (id: string) => `/api/notifications/${id}`,

  // Users
  USER_BY_ID: (userId: string) => `/api/users/${userId}`,
  USERS_SEARCH: (query: string) =>
    `/api/users?search=${encodeURIComponent(query)}`,

  // Leaderboard
  LEADERBOARD_WITH_QUERY: (params: URLSearchParams) =>
    `/api/leaderboard?${params.toString()}`,
} as const;

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES];
