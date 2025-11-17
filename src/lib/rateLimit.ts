// Simple in-memory rate limiter for API routes
// In production, consider using Redis or a more robust solution

interface RateLimitOptions {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit(
    identifier: string,
    options: RateLimitOptions
): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
        // First request or window expired
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + options.windowMs
        });
        return { allowed: true, remaining: options.maxRequests - 1 };
    }

    if (entry.count >= options.maxRequests) {
        return { allowed: false, resetTime: entry.resetTime };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(identifier, entry);

    return {
        allowed: true,
        remaining: options.maxRequests - entry.count,
        resetTime: entry.resetTime
    };
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

        const result = rateLimit(ip, options);

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