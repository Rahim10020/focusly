import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { Errors } from "../utils/response";
import type { ApiHandler, ApiMiddleware } from "./validation";

interface RequestError extends Error {
  requestId?: string;
}

/**
 * Compose multiple middlewares into a single middleware
 * Middlewares are applied from left to right (first middleware wraps the handler, then second, etc.)
 *
 * @example
 * const handler = compose(
 *   withRateLimit('standard'),
 *   withValidation(schema),
 *   withLogging()
 * )(async (req, context, data) => {
 *   // Your handler logic
 * });
 */
export function compose(...middlewares: ApiMiddleware[]): ApiMiddleware {
  return (handler: ApiHandler) => {
    // Apply middlewares from right to left (last middleware wraps first)
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler,
    );
  };
}

/**
 * Middleware to handle errors globally
 * Should be one of the first middlewares in the chain
 */
export function withErrorHandling(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (
      req: NextRequest,
      context: unknown,
      validatedData?: unknown,
    ) => {
      try {
        return await handler(req, context, validatedData);
      } catch (error) {
        // Get request ID if available
        const requestId =
          error && typeof error === "object" && "requestId" in error
            ? (error as RequestError).requestId
            : undefined;

        // Log the error
        logger.error("Unhandled API Error", error as Error, {
          requestId,
          method: req.method,
          url: req.url,
        });

        // Handle known error types
        if (error instanceof Error) {
          // Check if it's a known error type
          if (error.message.includes("not found")) {
            return Errors.notFound(error.message, requestId);
          }

          if (error.message.includes("unauthorized")) {
            return Errors.unauthorized(error.message, requestId);
          }

          if (error.message.includes("forbidden")) {
            return Errors.forbidden(error.message, requestId);
          }
        }

        // Return generic internal error
        return Errors.internal(
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : "An unexpected error occurred",
          requestId,
        );
      }
    };
  };
}

/**
 * Middleware to add CORS headers to responses
 */
export function withCors(options?: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}): ApiMiddleware {
  const defaultOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
    ...options,
  };

  return (handler: ApiHandler) => {
    return async (
      req: NextRequest,
      context: unknown,
      validatedData?: unknown,
    ) => {
      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new NextResponse(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin":
              typeof defaultOptions.origin === "string"
                ? defaultOptions.origin
                : defaultOptions.origin.join(", "),
            "Access-Control-Allow-Methods": defaultOptions.methods.join(", "),
            "Access-Control-Allow-Headers":
              defaultOptions.allowedHeaders.join(", "),
            ...(defaultOptions.credentials && {
              "Access-Control-Allow-Credentials": "true",
            }),
          },
        });
      }

      // Execute handler
      const response = await handler(req, context, validatedData);

      // Add CORS headers to response
      response.headers.set(
        "Access-Control-Allow-Origin",
        typeof defaultOptions.origin === "string"
          ? defaultOptions.origin
          : defaultOptions.origin.join(", "),
      );

      if (defaultOptions.credentials) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }

      return response;
    };
  };
}

/**
 * @deprecated This middleware is intentionally fail-closed until a real auth
 * strategy is implemented. Do not use it in production routes yet.
 */
export function withAuth(): ApiMiddleware {
  return (_handler: ApiHandler) => {
    return async () => {
      return Errors.internal(
        "withAuth middleware is not implemented. Use explicit route-level auth checks (session/user validation) until this middleware is fully implemented.",
      );
    };
  };
}
