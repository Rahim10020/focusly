/**
 * @fileoverview Structured logging service for application-wide logging.
 * Provides consistent log formatting with timestamps and context.
 * @module lib/logger
 */

/**
 * Available log levels for the logger.
 * @typedef {'info' | 'warn' | 'error' | 'debug'} LogLevel
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Context information to include with log messages.
 * @interface LogContext
 */
interface LogContext {
    /** Action being performed */
    action?: string;
    /** User ID associated with the action */
    userId?: string;
    /** Additional contextual data */
    [key: string]: unknown;
}

/**
 * Structured logging class with support for different log levels.
 * Outputs formatted messages in development and can be extended for production monitoring.
 * Supports child loggers with inherited context for better traceability.
 *
 * @class Logger
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.info('Task created', { action: 'createTask', userId: '123' });
 * logger.error('Failed to save', error, { action: 'saveTask' });
 * logger.debug('Debug info', { data: someData }); // Only in development
 *
 * @example
 * // Using child logger with inherited context
 * const userLogger = logger.child({ userId: '123', sessionId: 'abc' });
 * userLogger.info('Action completed'); // Automatically includes userId and sessionId
 */
class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private baseContext: LogContext = {};

    constructor(baseContext: LogContext = {}) {
        this.baseContext = baseContext;
    }

    /**
     * Creates a child logger with additional context.
     * The child logger will include both the parent's context and the new context.
     *
     * @param context - Additional context to include in all log messages
     * @returns A new Logger instance with combined context
     *
     * @example
     * const userLogger = logger.child({ userId: '123', sessionId: 'abc' });
     * userLogger.info('User logged in'); // Includes userId and sessionId
     *
     * const requestLogger = userLogger.child({ requestId: 'xyz' });
     * requestLogger.info('Processing request'); // Includes userId, sessionId, and requestId
     */
    child(context: LogContext): Logger {
        return new Logger({ ...this.baseContext, ...context });
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const mergedContext = { ...this.baseContext, ...context };
        let contextStr = '';
        if (Object.keys(mergedContext).length > 0) {
            try {
                contextStr = ` | ${JSON.stringify(mergedContext)}`;
            } catch {
                contextStr = ` | ${String(mergedContext)}`;
            }
        }
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
        const formattedMessage = this.formatMessage(level, message, context);

        // Console logging for development
        if (this.isDevelopment) {
            const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
            if (error) {
                logFn(formattedMessage, error);
            } else {
                logFn(formattedMessage);
            }
        }

        // TODO: In production, send to monitoring service (Sentry, LogRocket, etc.)
        // if (!this.isDevelopment) {
        //     this.sendToMonitoring(level, message, context, error);
        // }
    }

    /**
     * Log informational message
     */
    info(message: string, context?: LogContext) {
        this.log('info', message, context);
    }

    /**
     * Log warning message
     */
    warn(message: string, context?: LogContext) {
        this.log('warn', message, context);
    }

    /**
     * Log error message
      */
    error(message: string, error: Error | unknown, context?: LogContext) {
        let errorMessage: string;
        if (error instanceof Error) {
            errorMessage = error.message;
        } else {
            try {
                errorMessage = error && typeof error === 'object' ? JSON.stringify(error) : String(error);
            } catch {
                errorMessage = String(error);
            }
        }
        const errorObj = new Error(errorMessage);
        const errorStack = error instanceof Error ? error.stack : errorObj.stack;
        this.log('error', message, {
            ...context,
            errorMessage,
            errorStack,
        }, errorObj);
    }

    /**
     * Log debug message (only in development)
     */
    debug(message: string, context?: LogContext) {
        if (this.isDevelopment) {
            this.log('debug', message, context);
        }
    }
}

export const logger = new Logger();
