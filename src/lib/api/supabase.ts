/**
 * @fileoverview Supabase client provider for API routes.
 * Centralizes Supabase client initialization with authentication context.
 */

import { createClient } from "@supabase/supabase-js";
import { supabaseServerPool } from "@/lib/supabase/server";
import type { AuthContext } from "./middleware/auth";

/**
 * Get Supabase admin client
 * Use for server-side operations with full permissions
 * Requires appropriate RLS policies to be set
 */
export function getAdminSupabaseClient() {
  return supabaseServerPool.getAdminClient();
}

/**
 * Get Supabase client with user authentication
 * Use for operations that require user context and RLS enforcement
 *
 * @param auth - AuthContext from withAuthRequired() middleware
 * @returns Authenticated Supabase client with user's access token
 *
 * @example
 * export const GET = compose(
 *   withErrorHandling(),
 *   withAuthRequired(),
 * )(async (req, context, data, auth) => {
 *   const supabase = getUserSupabaseClient(auth);
 *   const { data: tasks } = await supabase
 *     .from('tasks')
 *     .select('*')
 *     .eq('user_id', auth.userId);
 *   return successResponse(tasks);
 * });
 */
export function getUserSupabaseClient(auth: AuthContext) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${auth.sessionToken}`,
        },
      },
    },
  );
}

/**
 * Get Supabase client for unauthenticated operations
 * Use for public data retrieval or guest operations
 */
export function getPublicSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
