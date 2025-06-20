import { logger } from '@/lib/logger';
/**
 * Debug Logger System
 * Provides structured, context-aware logging with configurable levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';
export type LogContext = 'auth' | 'realtime' | 'subscription' | 'fsm' | 'ui' | 'api' | 'performance' | 'general';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  location?: string;
}

class DebugLogger {
  private static instance: DebugLogger;
  private logLevel: LogLevel = 'info';
  private enabledContexts: Set<LogContext> = new Set<LogContext>(['auth', 'realtime', 'subscription', 'fsm']);
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 500;

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private constructor() {
    // Initialize log level from localStorage or environment
    if (typeof window !== 'undefined') {
      const savedLevel = localStorage.getItem('askjds-debug-level') as LogLevel;
      if (savedLevel) {
        this.logLevel = savedLevel;
      }

      const savedContexts = localStorage.getItem('askjds-debug-contexts');
      if (savedContexts) {
        try {
          const contexts = JSON.parse(savedContexts) as LogContext[];
          this.enabledContexts = new Set<LogContext>(contexts);
        } catch (e) {
          logger.warn('Failed to parse saved debug contexts');
        }
      }
    }

    // Auto-enable all contexts in development
    if (import.meta.env.DEV) {
      this.enabledContexts = new Set(['auth', 'realtime', 'subscription', 'fsm', 'ui', 'api', 'performance', 'general'] as LogContext[]);
    }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    if (typeof window !== 'undefined') {
      localStorage.setItem('askjds-debug-level', level);
    }
  }

  enableContext(context: LogContext) {
    this.enabledContexts.add(context);
    this.saveEnabledContexts();
  }

  disableContext(context: LogContext) {
    this.enabledContexts.delete(context);
    this.saveEnabledContexts();
  }

  toggleContext(context: LogContext) {
    if (this.enabledContexts.has(context)) {
      this.disableContext(context);
    } else {
      this.enableContext(context);
    }
  }

  private saveEnabledContexts() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('askjds-debug-contexts', JSON.stringify(Array.from(this.enabledContexts)));
    }
  }

  private shouldLog(level: LogLevel, context: LogContext): boolean {
    // Check if logging is enabled for this context
    if (!this.enabledContexts.has(context)) {
      return false;
    }

    // Check log level hierarchy
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'none'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private addToHistory(entry: LogEntry) {
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  private formatMessage(context: LogContext, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    return `[${timestamp}] [${context.toUpperCase()}] ${message}`;
  }

  debug(context: LogContext, message: string, data?: any, location?: string) {
    if (!this.shouldLog('debug', context)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'debug',
      context,
      message,
      data,
      location
    };

    this.addToHistory(entry);
    logger.debug(this.formatMessage(context, message), data ? data : '');
  }

  info(context: LogContext, message: string, data?: any, location?: string) {
    if (!this.shouldLog('info', context)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      context,
      message,
      data,
      location
    };

    this.addToHistory(entry);
    logger.info(this.formatMessage(context, message), data ? data : '');
  }

  warn(context: LogContext, message: string, data?: any, location?: string) {
    if (!this.shouldLog('warn', context)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'warn',
      context,
      message,
      data,
      location
    };

    this.addToHistory(entry);
    logger.warn(this.formatMessage(context, message), data ? data : '');
  }

  error(context: LogContext, message: string, data?: any, location?: string) {
    if (!this.shouldLog('error', context)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level: 'error',
      context,
      message,
      data,
      location
    };

    this.addToHistory(entry);
    logger.error(this.formatMessage(context, message), data ? data : '');
  }

  getHistory(context?: LogContext): LogEntry[] {
    if (context) {
      return this.logHistory.filter(entry => entry.context === context);
    }
    return this.logHistory;
  }

  clearHistory() {
    this.logHistory = [];
  }

  getStats() {
    const stats = {
      totalEntries: this.logHistory.length,
      byLevel: {} as Record<LogLevel, number>,
      byContext: {} as Record<LogContext, number>,
      recentErrors: this.logHistory.filter(e => e.level === 'error').slice(-5),
      currentLevel: this.logLevel,
      enabledContexts: Array.from(this.enabledContexts)
    };

    this.logHistory.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.byContext[entry.context] = (stats.byContext[entry.context] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const debugLogger = DebugLogger.getInstance();

// Convenience functions for common contexts
export const authLog = {
  debug: (message: string, data?: any, location?: string) => debugLogger.debug('auth', message, data, location),
  info: (message: string, data?: any, location?: string) => debugLogger.info('auth', message, data, location),
  warn: (message: string, data?: any, location?: string) => debugLogger.warn('auth', message, data, location),
  error: (message: string, data?: any, location?: string) => debugLogger.error('auth', message, data, location),
};

export const realtimeLog = {
  debug: (message: string, data?: any, location?: string) => debugLogger.debug('realtime', message, data, location),
  info: (message: string, data?: any, location?: string) => debugLogger.info('realtime', message, data, location),
  warn: (message: string, data?: any, location?: string) => debugLogger.warn('realtime', message, data, location),
  error: (message: string, data?: any, location?: string) => debugLogger.error('realtime', message, data, location),
};

export const subscriptionLog = {
  debug: (message: string, data?: any, location?: string) => debugLogger.debug('subscription', message, data, location),
  info: (message: string, data?: any, location?: string) => debugLogger.info('subscription', message, data, location),
  warn: (message: string, data?: any, location?: string) => debugLogger.warn('subscription', message, data, location),
  error: (message: string, data?: any, location?: string) => debugLogger.error('subscription', message, data, location),
};

export const fsmLog = {
  debug: (message: string, data?: any, location?: string) => debugLogger.debug('fsm', message, data, location),
  info: (message: string, data?: any, location?: string) => debugLogger.info('fsm', message, data, location),
  warn: (message: string, data?: any, location?: string) => debugLogger.warn('fsm', message, data, location),
  error: (message: string, data?: any, location?: string) => debugLogger.error('fsm', message, data, location),
};

export const performanceLog = {
  debug: (message: string, data?: any, location?: string) => debugLogger.debug('performance', message, data, location),
  info: (message: string, data?: any, location?: string) => debugLogger.info('performance', message, data, location),
  warn: (message: string, data?: any, location?: string) => debugLogger.warn('performance', message, data, location),
  error: (message: string, data?: any, location?: string) => debugLogger.error('performance', message, data, location),
}; 