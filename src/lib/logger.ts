type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
    action?: string;
    userId?: string;
    [key: string]: unknown;
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
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
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.log('error', message, {
            ...context,
            errorMessage: errorObj.message,
            errorStack: errorObj.stack,
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
