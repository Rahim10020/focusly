import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { Errors } from "../utils/response";
import type { ApiHandler, ApiMiddleware } from "./validation";
import { RATE_LIMIT_WINDOWS_MS } from "@/lib/constants";

/**
 * Rate limit tier configurations
 */
export const RateLimitTiers = {
  strict: {
    windowMs: RATE_LIMIT_WINDOWS_MS.ONE_MINUTE,
    maxRequests: 5,
  },
  standard: {
    windowMs: RATE_LIMIT_WINDOWS_MS.TEN_SECONDS,
    maxRequests: 10,
  },
  generous: {
    windowMs: RATE_LIMIT_WINDOWS_MS.ONE_MINUTE,
    maxRequests: 100,
  },
  relaxed: {
    windowMs: RATE_LIMIT_WINDOWS_MS.FIFTEEN_MINUTES,
    maxRequests: 1000,
  },
} as const;

export type RateLimitTier = keyof typeof RateLimitTiers;

/**
 * Get client identifier from request (IP address or user ID)
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  // Use the first available IP
  const ip =
    cfConnectingIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    realIp ||
    "unknown";

  return ip;
}

/**
 * Middleware to apply rate limiting to an API endpoint
 */
export function withRateLimit(tier: RateLimitTier = "standard"): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (
      req: NextRequest,
      context: unknown,
      validatedData?: unknown,
    ) => {
      const identifier = getClientIdentifier(req);
      const options = RateLimitTiers[tier];

      const result = await rateLimit(identifier, options);

      if (!result.allowed) {
        const retryAfter = result.resetTime
          ? Math.ceil((result.resetTime - Date.now()) / 1000)
          : 60;

        const headers: Record<string, string> = {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": options.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
        };

        if (result.resetTime) {
          headers["X-RateLimit-Reset"] = result.resetTime.toString();
        }

        return Errors.tooManyRequests(
          `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          headers,
        );
      }

      // Execute the handler
      const response = await handler(req, context, validatedData);

      // Add rate limit headers to successful responses
      if (result.remaining !== undefined) {
        response.headers.set(
          "X-RateLimit-Remaining",
          result.remaining.toString(),
        );
      }

      if (result.resetTime !== undefined) {
        response.headers.set("X-RateLimit-Reset", result.resetTime.toString());
      }

      response.headers.set("X-RateLimit-Limit", options.maxRequests.toString());

      return response;
    };
  };
}

/**
 * Middleware to apply custom rate limiting with specific options
 */
export function withCustomRateLimit(options: {
  windowMs: number;
  maxRequests: number;
}): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (
      req: NextRequest,
      context: unknown,
      validatedData?: unknown,
    ) => {
      const identifier = getClientIdentifier(req);

      const result = await rateLimit(identifier, options);

      if (!result.allowed) {
        const retryAfter = result.resetTime
          ? Math.ceil((result.resetTime - Date.now()) / 1000)
          : 60;

        const headers: Record<string, string> = {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": options.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
        };

        if (result.resetTime) {
          headers["X-RateLimit-Reset"] = result.resetTime.toString();
        }

        return Errors.tooManyRequests(
          `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          headers,
        );
      }

      // Execute the handler
      const response = await handler(req, context, validatedData);

      // Add rate limit headers to successful responses
      if (result.remaining !== undefined) {
        response.headers.set(
          "X-RateLimit-Remaining",
          result.remaining.toString(),
        );
      }

      if (result.resetTime !== undefined) {
        response.headers.set("X-RateLimit-Reset", result.resetTime.toString());
      }

      response.headers.set("X-RateLimit-Limit", options.maxRequests.toString());

      return response;
    };
  };
}
