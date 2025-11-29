/**
 * @fileoverview Rate limiting utilities for API protection.
 * Provides functions and middleware for limiting request frequency per identifier.
 * @module lib/rateLimit
 */

import { supabaseClient as supabase } from './supabase/client';
import { logger } from './logger';

/**
 * Configuration options for rate limiting.
 * @interface RateLimitOptions
 */
interface RateLimitOptions {
    /** Time window in milliseconds */
    windowMs: number;
    /** Maximum requests allowed per window */
    maxRequests: number;
}

/**
 * Checks and updates rate limit for a given identifier.
 * Uses Supabase to track request counts with automatic window expiration.
 *
 * @param {string} identifier - Unique identifier (e.g., IP address, user ID)
 * @param {RateLimitOptions} options - Rate limit configuration
 * @returns {Promise<{allowed: boolean, resetTime?: number, remaining?: number}>} Rate limit result
 *
 * @example
 * const result = await rateLimit('user-123', { windowMs: 60000, maxRequests: 10 });
 * if (!result.allowed) {
 *   return res.status(429).json({ error: 'Too many requests' });
 * }
 */
export async function rateLimit(
    identifier: string,
    options: RateLimitOptions
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    const now = new Date();

    try {
        // Try to get existing rate limit entry
        const { data, error: fetchError } = await supabase
            .from('rate_limits')
            .select('count, reset_time')
            .eq('identifier', identifier)
            .single();

        const existingEntry = data as { count: number; reset_time: string } | null;

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            logger.error('Error fetching rate limit', fetchError as Error, {
                action: 'rateLimitFetch',
                identifier
            });
            // Allow request on error to avoid blocking users
            return { allowed: true };
        }

        const resetTime = new Date(now.getTime() + options.windowMs);

        if (existingEntry && now <= new Date(existingEntry.reset_time)) {
            // Existing entry within window
            if (existingEntry.count >= options.maxRequests) {
                return { allowed: false, resetTime: new Date(existingEntry.reset_time).getTime() };
            }

            // Increment counter
            const newCount = existingEntry.count + 1;
            const { error: updateError } = await (supabase.from('rate_limits') as any)
                .update({ count: newCount })
                .eq('identifier', identifier);

            if (updateError) {
                logger.error('Error updating rate limit', updateError as Error, {
                    action: 'rateLimitUpdate',
                    identifier
                });
                return { allowed: true };
            }

            return {
                allowed: true,
                remaining: options.maxRequests - newCount,
                resetTime: new Date(existingEntry.reset_time).getTime()
            };
        } else {
            // First request or window expired
            const { error: upsertError } = await (supabase.from('rate_limits') as any)
                .upsert({
                    identifier,
                    count: 1,
                    reset_time: resetTime.toISOString()
                }, {
                    onConflict: 'identifier'
                });

            if (upsertError) {
                logger.error('Error upserting rate limit', upsertError as Error, {
                    action: 'rateLimitUpsert',
                    identifier
                });
                return { allowed: true };
            }

            return { allowed: true, remaining: options.maxRequests - 1, resetTime: resetTime.getTime() };
        }
    } catch (error) {
        logger.error('Rate limit error', error as Error, {
            action: 'rateLimit',
            identifier
        });
        // Allow request on error
        return { allowed: true };
    }
}

/**
 * Higher-order function that wraps an API handler with rate limiting.
 * Automatically extracts client IP and adds rate limit headers to responses.
 *
 * @param {Function} handler - The API route handler to wrap
 * @param {RateLimitOptions} [options] - Rate limit configuration (default: 100 requests per 15 minutes)
 * @returns {Function} Wrapped handler with rate limiting
 *
 * @example
 * // In API route
 * export const GET = withRateLimit(async (request) => {
 *   return Response.json({ data: 'success' });
 * }, { windowMs: 60000, maxRequests: 30 });
 */
export function withRateLimit(
    handler: Function,
    options: RateLimitOptions = { windowMs: 15 * 60 * 1000, maxRequests: 100 }
) {
    return async (request: Request, ...args: any[]) => {
        // Get client IP (in production, use proper IP extraction)
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const result = await rateLimit(ip, options);

        if (!result.allowed) {
            return new Response(JSON.stringify({
                error: 'Too many requests',
                retryAfter: Math.ceil((result.resetTime! - Date.now()) / 1000)
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': Math.ceil((result.resetTime! - Date.now()) / 1000).toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.resetTime!.toString()
                }
            });
        }

        // Add rate limit headers to response
        const response = await handler(request, ...args);

        if (response instanceof Response) {
            if (result.remaining !== undefined) {
                response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
            }
            if (result.resetTime !== undefined) {
                response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
            }
        }

        return response;
    };
}