/**
 * API Middleware exports
 * 
 * This module provides a collection of composable middleware functions
 * for Next.js API routes. All middlewares follow a consistent pattern
 * and can be combined using the compose function.
 */

export { withValidation, withQueryValidation, withBodyAndQueryValidation } from './validation';
export type { ApiHandler, ApiMiddleware } from './validation';

export { withRateLimit, withCustomRateLimit, RateLimitTiers } from './rateLimit';
export type { RateLimitTier } from './rateLimit';

export { withLogging, withRequestId, withPerformanceLogging } from './logging';

export { compose, withErrorHandling, withCors, withAuth } from './compose';
