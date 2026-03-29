/**
 * @fileoverview Rate limiting configuration.
 * Used for API endpoints and client-side request throttling.
 */

import { TIME_MS } from "./time";

/** Shared rate-limit windows used across middleware and server helpers. */
export const RATE_LIMIT_WINDOWS_MS = {
  TEN_SECONDS: 10 * TIME_MS.SECOND,
  ONE_MINUTE: TIME_MS.MINUTE,
  FIVE_MINUTES: 5 * TIME_MS.MINUTE,
  FIFTEEN_MINUTES: 15 * TIME_MS.MINUTE,
} as const;

/** Rate limit thresholds for different endpoints */
export const RATE_LIMIT_THRESHOLDS = {
  // API limits
  API_GENERAL: {
    window: RATE_LIMIT_WINDOWS_MS.ONE_MINUTE,
    limit: 60,
  },
  API_AUTH: {
    window: RATE_LIMIT_WINDOWS_MS.FIVE_MINUTES,
    limit: 5,
  },
  API_TASKS: {
    window: RATE_LIMIT_WINDOWS_MS.ONE_MINUTE,
    limit: 30,
  },
} as const;
