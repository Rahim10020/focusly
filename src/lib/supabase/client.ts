/**
 * @fileoverview Client-side Supabase configuration.
 * This file provides a lazy-initialized Supabase client instance safe for browser usage.
 * Uses NEXT_PUBLIC_SUPABASE_ANON_KEY which is safe to expose in the browser.
 *
 * @note This client respects Row Level Security (RLS) policies.
 * @note Do NOT add "use client" here — this is a utility file, not a React component.
 *       The client is initialized lazily (only when first called) to avoid SSR issues
 *       where environment variables may not be available at module load time.
 * @module lib/supabase/client
 */

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

/** Singleton Supabase client instance for browser usage */
let supabaseClientInstance: SupabaseClient<Database> | null = null;

const getSupabaseConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

/**
 * Gets or creates a lazy-initialized client-side Supabase instance.
 * Safe for browser usage with RLS enabled.
 *
 * The instance is created only on the first call (singleton pattern),
 * ensuring a single client is reused across the entire application
 * and avoiding multiple GoTrue auth instances.
 *
 * @returns {SupabaseClient<Database>} Typed Supabase client with ANON key
 * @throws {Error} If environment variables NEXT_PUBLIC_SUPABASE_URL or
 *                 NEXT_PUBLIC_SUPABASE_ANON_KEY are not set
 *
 * @example
 * import { getSupabaseClient } from '@/lib/supabase/client';
 *
 * // In a client component or event handler
 * const supabaseClient = getSupabaseClient();
 * const { data, error } = await supabaseClient.from('tasks').select('*');
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set",
    );
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
  }

  return supabaseClientInstance;
};

export const getSupabaseClientOrNull = (): SupabaseClient<Database> | null => {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createBrowserClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
    );
  }

  return supabaseClientInstance;
};
