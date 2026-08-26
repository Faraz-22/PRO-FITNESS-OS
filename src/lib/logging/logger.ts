export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  userId?: string;
  branchId?: string;
  route?: string;
  action?: string;
  durationMs?: number;
  errorCode?: string;
  [key: string]: unknown;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    // Redact sensitive keys if passed accidentally
    const safeContext = { ...context };
    const sensitiveKeys = ['password', 'secret', 'token', 'creditCard'];
    
    for (const key of Object.keys(safeContext)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        safeContext[key] = '[REDACTED]';
      }
    }

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      ...safeContext,
    });
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    const errorDetails = error instanceof Error ? {
      errorMessage: error.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    } : { rawError: error };
    
    console.error(this.formatMessage('ERROR', message, { ...context, ...errorDetails }));
  }
}

export const logger = new Logger();
