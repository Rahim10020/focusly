/**
 * @fileoverview Server-side Supabase configuration.
 * This file provides a Supabase admin client with SERVICE_ROLE privileges.
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * This file uses SUPABASE_SERVICE_ROLE_KEY which bypasses Row Level Security (RLS).
 * NEVER import this file in client components or client-accessible code.
 * Only use in:
 * - API routes (app/api/**/route.ts)
 * - Server components
 * - Server actions
 * 
 * @module lib/supabase/server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Creates a server-side Supabase admin client with SERVICE_ROLE key.
 * This client bypasses Row Level Security (RLS) policies.
 * 
 * ⚠️ Use with extreme caution - always validate user permissions manually!
 * 
 * @returns {SupabaseClient<Database>} Supabase admin client
 * @throws {Error} If server-side credentials are not configured
 * 
 * @example
 * // In API route or server component only
 * import { getSupabaseAdmin } from '@/lib/supabase/server';
 * 
 * export async function POST(request: Request) {
 *   const session = await getServerSession(authOptions);
 *   if (!session?.user?.id) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   
 *   const supabaseAdmin = getSupabaseAdmin();
 *   const { data, error } = await supabaseAdmin
 *     .from('tasks')
 *     .update({ completed: true })
 *     .eq('id', taskId)
 *     .eq('user_id', session.user.id); // Always filter by authenticated user!
 * }
 */
export const getSupabaseAdmin = (): SupabaseClient<Database> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Server Supabase credentials not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};

/**
 * Singleton pool for server-side Supabase connections.
 * Reuses the same admin client instance for better performance.
 */
class SupabaseServerPool {
    private static instance: SupabaseServerPool;
    private adminClient: SupabaseClient<Database> | null = null;

    private constructor() {}

    static getInstance(): SupabaseServerPool {
        if (!SupabaseServerPool.instance) {
            SupabaseServerPool.instance = new SupabaseServerPool();
        }
        return SupabaseServerPool.instance;
    }

    getAdminClient(): SupabaseClient<Database> {
        if (!this.adminClient) {
            this.adminClient = getSupabaseAdmin();
        }
        return this.adminClient;
    }
}

/**
 * Pooled Supabase admin client for better performance in API routes.
 * Reuses the same connection instead of creating a new one each time.
 * 
 * @example
 * import { supabaseServerPool } from '@/lib/supabase/server';
 * const supabaseAdmin = supabaseServerPool.getAdminClient();
 */
export const supabaseServerPool = SupabaseServerPool.getInstance();
