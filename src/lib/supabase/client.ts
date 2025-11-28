/**
 * @fileoverview Client-side Supabase configuration.
 * This file provides a Supabase client instance safe for browser usage.
 * Uses NEXT_PUBLIC_SUPABASE_ANON_KEY which is safe to expose in the browser.
 * 
 * @note This client respects Row Level Security (RLS) policies.
 * @module lib/supabase/client
 */

'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/** Singleton Supabase client instance for browser usage */
let supabaseClientInstance: SupabaseClient<Database> | null = null;

/**
 * Gets or creates a client-side Supabase instance.
 * Safe for browser usage with RLS enabled.
 * 
 * @returns {SupabaseClient<Database>} Typed Supabase client with ANON key
 * @throws {Error} If environment variables are not set
 * 
 * @example
 * import { getSupabaseClient } from '@/lib/supabase/client';
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('tasks').select('*');
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
    if (!supabaseClientInstance) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
        }
        
        supabaseClientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
        });
    }
    return supabaseClientInstance;
};

/**
 * Supabase client instance for client-side database operations.
 * Use this exported client throughout the application in client components.
 * 
 * @example
 * import { supabaseClient } from '@/lib/supabase/client';
 * const { data, error } = await supabaseClient.from('tasks').select('*');
 */
export const supabaseClient = getSupabaseClient();
