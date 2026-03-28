import { TIME_MS } from "./time";

/** Shared rate-limit windows used across middleware and server helpers. */
export const RATE_LIMIT_WINDOWS_MS = {
  TEN_SECONDS: 10 * TIME_MS.SECOND,
  ONE_MINUTE: TIME_MS.MINUTE,
  FIFTEEN_MINUTES: 15 * TIME_MS.MINUTE,
} as const;
