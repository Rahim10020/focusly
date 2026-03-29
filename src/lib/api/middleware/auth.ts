/**
 * @fileoverview Authentication middleware for API routes.
 * Handles session validation and user context extraction via Supabase SSR.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export type AuthenticatedApiHandler = (
  req: any,
  context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) => Promise<any>;

function getBearerToken(req: any): string | undefined {
  const headerValue: unknown = req?.headers?.get
    ? req.headers.get("authorization")
    : undefined;

  if (typeof headerValue !== "string") return undefined;

  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // Read-only error ignored in API routes
          }
        },
      },
    },
  );
}

async function getAuthContext(req: any): Promise<AuthContext | undefined> {
  const supabase = await getSupabaseServerClient();

  // Try to get bearer token first (most secure option for API routes)
  const bearerToken = getBearerToken(req);
  if (bearerToken) {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearerToken);

    if (!error && user?.id) {
      return {
        userId: user.id,
        userEmail: user.email || "",
        sessionToken: bearerToken,
      };
    }
  }

  // Fallback to session cookie (less secure but needed for server-side renders)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.id) {
    return {
      userId: session.user.id,
      userEmail: session.user.email || "",
      sessionToken: session.access_token,
    };
  }

  return undefined;
}

export function withAuthRequired(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (
      req: any,
      context: unknown,
      validatedData: unknown,
      ...args: unknown[]
    ) => {
      try {
        const authContext = await getAuthContext(req);
        if (!authContext?.userId || !authContext.sessionToken) {
          return Errors.unauthorized();
        }

        return await (handler as any)(
          req,
          context,
          validatedData,
          authContext,
          ...args,
        );
      } catch (error) {
        return Errors.internal("Authentication failed");
      }
    };
  };
}

export function withOptionalAuth(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (
      req: any,
      context: unknown,
      validatedData: unknown,
      ...args: unknown[]
    ) => {
      try {
        const authContext = await getAuthContext(req);

        return await (handler as any)(
          req,
          context,
          validatedData,
          authContext,
          ...args,
        );
      } catch (error) {
        return await (handler as ApiHandler)(
          req,
          context,
          validatedData,
          ...args,
        );
      }
    };
  };
}
