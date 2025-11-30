/**
 * @fileoverview Server-side Supabase configuration.
 * This file provides a Supabase admin client with SERVICE_ROLE privileges.
 *
 * SECURITY WARNING: This file uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
 * NEVER import this file in client components or client-accessible code.
 * Only use in API routes, server components, and server actions.
 *
 * @module lib/supabase/server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

/**
 * Creates a server-side Supabase admin client with SERVICE_ROLE key.
 * This client bypasses Row Level Security (RLS) policies.
 *
 * WARNING: Use with extreme caution - always validate user permissions manually!
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
 * Implements connection pooling with automatic timeout and health checks.
 */
class SupabaseServerPool {
    private static instance: SupabaseServerPool;
    private adminClient: SupabaseClient<Database> | null = null;
    private connectionCount = 0;
    private lastHealthCheck = 0;
    private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
    private readonly MAX_CONNECTION_AGE = 3600000; // 1 hour
    private connectionCreatedAt = 0;

    private constructor() { }

    static getInstance(): SupabaseServerPool {
        if (!SupabaseServerPool.instance) {
            SupabaseServerPool.instance = new SupabaseServerPool();
        }
        return SupabaseServerPool.instance;
    }

    /**
     * Performs a health check on the current connection.
     * Returns true if connection is healthy.
     */
    private async healthCheck(): Promise<boolean> {
        if (!this.adminClient) return false;

        try {
            const { error } = await this.adminClient
                .from('users')
                .select('id')
                .limit(1)
                .single();

            // PGRST116 is "no rows found" which is acceptable for health check
            return !error || error.code === 'PGRST116';
        } catch {
            return false;
        }
    }

    /**
     * Resets the connection pool by creating a new admin client.
     */
    private resetConnection(): void {
        this.adminClient = null;
        this.connectionCreatedAt = 0;
        this.lastHealthCheck = 0;
    }

    /**
     * Gets or creates an admin client with health checks and connection recycling.
     * Now synchronous for backward compatibility.
     */
    getAdminClient(): SupabaseClient<Database> {
        const now = Date.now();

        // Check if connection needs to be recycled due to age
        if (this.adminClient && this.connectionCreatedAt > 0) {
            const connectionAge = now - this.connectionCreatedAt;
            if (connectionAge > this.MAX_CONNECTION_AGE) {
                this.resetConnection();
            }
        }

        // Perform periodic health checks asynchronously (non-blocking)
        if (this.adminClient && now - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
            this.healthCheck().then((isHealthy) => {
                this.lastHealthCheck = now;
                if (!isHealthy) {
                    this.resetConnection();
                }
            }).catch(() => {
                // Ignore health check errors
            });
        }

        // Create new connection if needed
        if (!this.adminClient) {
            this.adminClient = getSupabaseAdmin();
            this.connectionCreatedAt = now;
            this.lastHealthCheck = now;
        }

        this.connectionCount++;
        return this.adminClient;
    }

    /**
     * Gets the pool statistics for monitoring.
     */
    getStats() {
        return {
            connectionCount: this.connectionCount,
            connectionAge: this.connectionCreatedAt > 0
                ? Date.now() - this.connectionCreatedAt
                : 0,
            lastHealthCheck: this.lastHealthCheck,
            isActive: this.adminClient !== null,
        };
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
