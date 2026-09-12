/**
 * Structured logging utility for the application.
 *
 * Provides consistent logging across the codebase with:
 * - Log levels (debug, info, warn, error)
 * - Structured context (component, action, data)
 * - Sentry integration for error tracking
 * - Development-friendly console output
 *
 * @example
 * import { logger } from '@/shared/lib/logger';
 *
 * // Basic logging
 * logger.info('User logged in', { userId: '123' });
 *
 * // With component context
 * logger.error('Payment failed', {
 *   component: 'CheckoutPage',
 *   action: 'processPayment',
 *   error: paymentError,
 *   data: { bookingId, amount }
 * });
 *
 * // Create a scoped logger for a component
 * const log = logger.child('AuthProvider');
 * log.info('Session restored');
 */

import * as Sentry from '@sentry/react';

// ============================================================================
// Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Component or module name where the log originated */
  component?: string;
  /** Action or operation being performed */
  action?: string;
  /** Error object if logging an error */
  error?: unknown;
  /** Additional structured data */
  data?: Record<string, unknown>;
  /** User ID for user-scoped logs */
  userId?: string;
  /** Request/operation ID for tracing */
  traceId?: string;
  /** Any additional context fields */
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(component: string): Logger;
}

// ============================================================================
// Configuration
// ============================================================================

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6', // blue
  warn: '#F59E0B', // amber
  error: '#EF4444', // red
};

function getMinLogLevel(): LogLevel {
  // In production, only log warnings and errors
  if (import.meta.env.PROD) {
    return 'warn';
  }
  // In development, log everything
  return 'debug';
}

function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

// ============================================================================
// Formatters
// ============================================================================

function formatError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // Include cause if present (ES2022+)
      ...(error.cause ? { cause: formatError(error.cause) } : {}),
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error as Record<string, unknown>;
  }

  return { value: String(error) };
}

function formatContext(context: LogContext): Record<string, unknown> {
  const { error, ...rest } = context;

  return {
    ...rest,
    ...(error ? { error: formatError(error) } : {}),
  };
}

function createLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: formatContext(context),
  };
}

// ============================================================================
// Console Output
// ============================================================================

function logToConsole(entry: LogEntry): void {
  const { level, message, timestamp, context } = entry;
  const color = LOG_LEVEL_COLORS[level];
  const prefix = `[${level.toUpperCase()}]`;

  // Use appropriate console method
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  // Format for development readability
  if (import.meta.env.DEV) {
    const timeStr = new Date(timestamp).toLocaleTimeString();
    const componentStr = context.component ? ` [${context.component}]` : '';
    const actionStr = context.action ? ` ${context.action}:` : '';

    consoleFn(
      `%c${timeStr} ${prefix}%c${componentStr}%c${actionStr} ${message}`,
      `color: ${color}; font-weight: bold`,
      'color: #6B7280; font-weight: normal',
      'color: inherit; font-weight: normal',
      Object.keys(context).length > 0 ? context : '',
    );
  } else {
    // In production, log as JSON for easier parsing
    consoleFn(JSON.stringify(entry));
  }
}

// ============================================================================
// Sentry Integration
// ============================================================================

function logToSentry(entry: LogEntry): void {
  const { level, message, context } = entry;

  // Only send warnings and errors to Sentry
  if (level !== 'warn' && level !== 'error') {
    return;
  }

  // Set context for Sentry
  if (context.component) {
    Sentry.setTag('component', context.component);
  }
  if (context.action) {
    Sentry.setTag('action', context.action);
  }
  if (context.userId) {
    Sentry.setUser({ id: context.userId });
  }

  // Add breadcrumb for context
  Sentry.addBreadcrumb({
    category: context.component ?? 'app',
    message,
    level: level === 'error' ? 'error' : 'warning',
    data: context.data,
  });

  // Capture error or message
  if (level === 'error') {
    if (context.error instanceof Error) {
      Sentry.captureException(context.error, {
        extra: context.data,
        tags: {
          component: context.component,
          action: context.action,
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { ...context.data, error: context.error },
        tags: {
          component: context.component,
          action: context.action,
        },
      });
    }
  } else if (level === 'warn') {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context.data,
      tags: {
        component: context.component,
        action: context.action,
      },
    });
  }
}

// ============================================================================
// Logger Implementation
// ============================================================================

function createLogger(baseContext: LogContext = {}): Logger {
  const log = (level: LogLevel, message: string, context: LogContext = {}) => {
    if (!shouldLog(level)) {
      return;
    }

    const mergedContext = { ...baseContext, ...context };
    const entry = createLogEntry(level, message, mergedContext);

    logToConsole(entry);
    logToSentry(entry);
  };

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),

    /**
     * Create a child logger with preset context.
     * Useful for component-scoped logging.
     */
    child: (component: string) => createLogger({ ...baseContext, component }),
  };
}

// ============================================================================
// Singleton Export
// ============================================================================

/**
 * Global logger instance.
 *
 * @example
 * // Direct usage
 * logger.info('User action', { action: 'click', data: { button: 'submit' } });
 *
 * // Component-scoped
 * const log = logger.child('MyComponent');
 * log.error('Failed to load', { error: err });
 */
export const logger = createLogger();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Log an API request/response cycle.
 */
export function logApiCall(options: {
  endpoint: string;
  method?: string;
  status?: 'start' | 'success' | 'error';
  duration?: number;
  error?: unknown;
  data?: Record<string, unknown>;
}): void {
  const { endpoint, method = 'GET', status = 'start', duration, error, data } = options;
  const action = `${method} ${endpoint}`;

  switch (status) {
    case 'start':
      logger.debug(`API call started: ${action}`, {
        component: 'api',
        action,
        data,
      });
      break;
    case 'success':
      logger.info(`API call succeeded: ${action}`, {
        component: 'api',
        action,
        data: { ...data, durationMs: duration },
      });
      break;
    case 'error':
      logger.error(`API call failed: ${action}`, {
        component: 'api',
        action,
        error,
        data: { ...data, durationMs: duration },
      });
      break;
  }
}

/**
 * Create a timer for measuring operation duration.
 */
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

/**
 * Log with automatic duration measurement.
 *
 * @example
 * const done = logTimed('Fetching user data', { component: 'UserService' });
 * const user = await fetchUser();
 * done(); // Logs completion with duration
 */
export function logTimed(
  message: string,
  context: LogContext = {},
): (result?: { error?: unknown }) => void {
  const timer = createTimer();
  logger.debug(`${message} - started`, context);

  return (result = {}) => {
    const duration = timer();
    if (result.error) {
      logger.error(`${message} - failed`, {
        ...context,
        error: result.error,
        data: { ...context.data, durationMs: duration },
      });
    } else {
      logger.info(`${message} - completed`, {
        ...context,
        data: { ...context.data, durationMs: duration },
      });
    }
  };
}
