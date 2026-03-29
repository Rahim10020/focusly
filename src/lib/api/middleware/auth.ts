/**
 * @fileoverview Authentication middleware for API routes.
 * Handles session validation and user context extraction via Supabase SSR.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

export type AuthenticatedApiHandler = (
  req: any,
  context: unknown,
  validatedData: unknown,
  auth: AuthContext,
) => Promise<any>;

async function getSupabaseServerSession() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
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
              cookieStore.set({ name, value, ...options })
            });
          } catch {
            // Read-only error ignored in API routes
          }
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function withAuthRequired(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: any, context: unknown, validatedData: unknown) => {
      try {
        const session = await getSupabaseServerSession();

        if (!session?.user?.id) {
          return Errors.unauthorized();
        }

        const authContext: AuthContext = {
          userId: session.user.id,
          userEmail: session.user.email || "",
          sessionToken: session.access_token,
        };

        return await (handler as any)(req, context, validatedData, authContext);
      } catch (error) {
        return Errors.internal("Authentication failed");
      }
    };
  };
}

export function withOptionalAuth(): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: any, context: unknown, validatedData: unknown) => {
      try {
        const session = await getSupabaseServerSession();

        let authContext: AuthContext | undefined;
        if (session?.user?.id) {
          authContext = {
            userId: session.user.id,
            userEmail: session.user.email || "",
            sessionToken: session.access_token,
          };
        }

        return await (handler as any)(req, context, validatedData, authContext);
      } catch (error) {
        return await (handler as ApiHandler)(req, context, validatedData);
      }
    };
  };
}
