/**
 * @fileoverview Application routes.
 * Centralized route definitions to avoid hardcoding URLs.
 */

export const ROUTES = {
  // Home & Auth
  HOME: "/",
  DASHBOARD: "/dashboard",
  HOW_TO_USE: "/how-to-use",

  // Authentication
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  VERIFY_EMAIL: "/verify-email",

  // Productivity
  TASKS: "/tasks",
  CREATE_TASK: "/create-task",
  CALENDAR: "/calendar",
  STATS: "/stats",

  // Social & Gamification
  FRIENDS: "/friends",
  LEADERBOARD: "/leaderboard",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

export const DYNAMIC_ROUTES = {
  USER_PROFILE: (userId: string) => `/users/${userId}`,
  TASKS_EDIT: (taskId: string) => `/tasks?edit=${taskId}`,
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
