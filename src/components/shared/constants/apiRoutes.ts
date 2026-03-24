export const API_ROUTES = {
  FRIENDS: '/api/friends',
  LEADERBOARD: '/api/leaderboard',
  NOTIFICATIONS: '/api/notifications',
  USERS: '/api/users',
  USER_PREFERENCES: '/api/user/preferences',
} as const;

export const API_DYNAMIC_ROUTES = {
  FRIEND_BY_ID: (id: string) => `/api/friends/${id}`,
  NOTIFICATION_BY_ID: (id: string) => `/api/notifications/${id}`,
  USER_BY_ID: (userId: string) => `/api/users/${userId}`,
  USERS_SEARCH: (query: string) =>
    `/api/users?search=${encodeURIComponent(query)}`,
  LEADERBOARD_WITH_QUERY: (params: URLSearchParams) =>
    `/api/leaderboard?${params.toString()}`,
} as const;
