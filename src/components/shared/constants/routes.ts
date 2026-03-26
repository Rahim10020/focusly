export const ROUTES = {
  // HOME
  HOME: "/",
  DASHBOARD: "/dashboard",
  HOW_TO_USE: "/how-to-use",

  // AUTH
  SIGN_IN: "/signin",
  SIGN_UP: "/signup",
  VERIFY_EMAIL: "/auth/verify-email",

  // PRODUCTIVITY
  TASKS: "/tasks",
  CREATE_TASK: "/create-task",
  CALENDAR: "/calendar",
  STATS: "/stats",

  // SOCIAL
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
