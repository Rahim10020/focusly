/**
 * @fileoverview Authentication middleware for API routes.
 * Handles session validation and user context extraction.
 * Replaces manual auth checks across all routes.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { Errors } from "../utils/response";
import type { ApiHandler, ApiMiddleware } from "./validation";

/**
 * Authenticated user context injected by withAuthRequired middleware
 */
export interface AuthContext {
  userId: string;
  userEmail: string;
  sessionToken: string;
}

/**
 * API Handler with auth context
 */
export type AuthenticatedApiHandler = (
  req: any,
  context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) => Promise<any>;

/**
 * Middleware to require authentication
 * Validates session and returns 401 if not authenticated
 * Injects AuthContext as 4th parameter to handler
 *
 * @example
 * export const GET = compose(
 *   withErrorHandling(),
 *   withAuthRequired(),
 *   withLogging()
 * )(async (req, context, data, auth) => {
 *   // auth.userId is guaranteed to be set
 *   return successResponse({ userId: auth.userId });
 * });
 */
export function withAuthRequired(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: any, context: unknown, validatedData: unknown) => {
      try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
          logger.error(
            "Unauthorized API access attempt",
            new Error("No session"),
            {
              method: req.method,
              url: req.url,
            },
          );
          return Errors.unauthorized();
        }

        // Extract auth context
        const authContext: AuthContext = {
          userId: session.user.id,
          userEmail: session.user.email || "",
          sessionToken: (session.accessToken as string) || "",
        };

        // Call handler with auth context
        return await (handler as any)(req, context, validatedData, authContext);
      } catch (error) {
        logger.error("Auth middleware error", error as Error, {
          method: req.method,
          url: req.url,
        });
        return Errors.internal("Authentication failed");
      }
    };
  };
}

/**
 * Middleware to optionally authenticate
 * Returns AuthContext if session exists, undefined otherwise
 * Allows routes to work both authenticated and unauthenticated
 *
 * @example
 * export const GET = compose(
 *   withErrorHandling(),
 *   withOptionalAuth(),
 *   withLogging()
 * )(async (req, context, data, auth) => {
 *   if (auth) {
 *     return successResponse({ content: 'private', userId: auth.userId });
 *   }
 *   return successResponse({ content: 'public' });
 * });
 */
export function withOptionalAuth(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: any, context: unknown, validatedData: unknown) => {
      try {
        const session = await getServerSession(authOptions);

        let authContext: AuthContext | undefined;
        if (session?.user?.id) {
          authContext = {
            userId: session.user.id,
            userEmail: session.user.email || "",
            sessionToken: (session.accessToken as string) || "",
          };
        }

        // Call handler with optional auth context
        return await (handler as any)(req, context, validatedData, authContext);
      } catch (error) {
        logger.error("Optional auth middleware error", error as Error, {
          method: req.method,
          url: req.url,
        });
        // Continue without auth on error
        return await (handler as ApiHandler)(req, context, validatedData);
      }
    };
  };
}
