/**
 * Centralized logger for production-safe logging
 * Respects environment and strips sensitive data
 */

import { Sanitizer, sanitizeError } from './sanitizer';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  private correlationId?: string;

  /**
   * Masks sensitive data using the Sanitizer
   */
  private sanitize(data: any): any {
    return Sanitizer.sanitize(data);
  }

  /**
   * Formats log message with timestamp and context
   */
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const correlationInfo = this.correlationId ? ` [${this.correlationId}]` : '';
    const contextStr = context ? ` ${JSON.stringify(this.sanitize(context))}` : '';
    
    return `[${timestamp}] [${level.toUpperCase()}]${correlationInfo} ${message}${contextStr}`;
  }

  /**
   * Sets correlation ID for request tracking
   */
  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment && this.debugMode) {
      console.log(this.format('debug', message, context));
    }
  }

  /**
   * Info level - development only by default
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.format('info', message, context));
    }
  }

  /**
   * Warning level - always enabled but sanitized
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.format('warn', message, context));
    
    // In production, send to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring('warn', message, context);
    }
  }

  /**
   * Error level - always enabled with full tracking
   */
  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? {
      ...context,
      ...sanitizeError(error)
    } : context;
    
    console.error(this.format('error', message, errorContext));
    
    // Always send errors to monitoring
    this.sendToMonitoring('error', message, errorContext, error);
  }

  /**
   * Performance logging - development only
   */
  performance(operation: string, duration: number, context?: LogContext) {
    if (this.isDevelopment) {
      this.debug(`Performance: ${operation} took ${duration}ms`, context);
    } else if (duration > 1000) {
      // Log slow operations in production
      this.sendToMonitoring('performance', `Slow operation: ${operation}`, {
        ...context,
        duration,
      });
    }
  }

  /**
   * Group related logs - development only
   */
  group(label: string) {
    if (this.isDevelopment && console.group) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Send logs to monitoring service (placeholder for integration)
   */
  private sendToMonitoring(
    level: string,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    // TODO: Integrate with Sentry, LogRocket, etc.
    // For now, this is a placeholder
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, {
        level,
        extra: this.sanitize(context),
        ...(error && { exception: error }),
      });
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger }; 