import { supabase } from './supabase';

interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

export async function rateLimit(
    identifier: string,
    options: RateLimitOptions
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
    const now = new Date();

    try {
        // Try to get existing rate limit entry
        const { data: existingEntry, error: fetchError } = await supabase
            .from('rate_limits')
            .select('count, reset_time')
            .eq('identifier', identifier)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error fetching rate limit:', fetchError);
            // Allow request on error to avoid blocking users
            return { allowed: true };
        }

        const resetTime = new Date(now.getTime() + options.windowMs);

        if (!existingEntry || now > new Date(existingEntry.reset_time)) {
            // First request or window expired
            const { error: upsertError } = await supabase
                .from('rate_limits')
                .upsert({
                    identifier,
                    count: 1,
                    reset_time: resetTime.toISOString()
                }, {
                    onConflict: 'identifier'
                });

            if (upsertError) {
                console.error('Error upserting rate limit:', upsertError);
                return { allowed: true };
            }

            return { allowed: true, remaining: options.maxRequests - 1 };
        }

        if (existingEntry.count >= options.maxRequests) {
            return { allowed: false, resetTime: new Date(existingEntry.reset_time).getTime() };
        }

        // Increment counter
        const newCount = existingEntry.count + 1;
        const { error: updateError } = await supabase
            .from('rate_limits')
            .update({ count: newCount })
            .eq('identifier', identifier);

        if (updateError) {
            console.error('Error updating rate limit:', updateError);
            return { allowed: true };
        }

        return {
            allowed: true,
            remaining: options.maxRequests - newCount,
            resetTime: new Date(existingEntry.reset_time).getTime()
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        // Allow request on error
        return { allowed: true };
    }
}

// Middleware function for API routes
export function withRateLimit(
    handler: Function,
    options: RateLimitOptions = { windowMs: 15 * 60 * 1000, maxRequests: 100 } // 100 requests per 15 minutes
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
            response.headers.set('X-RateLimit-Remaining', result.remaining!.toString());
            response.headers.set('X-RateLimit-Reset', result.resetTime!.toString());
        }

        return response;
    };
}