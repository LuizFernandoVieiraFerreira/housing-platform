/**
 * Result type for type-safe error handling.
 *
 * Inspired by Rust's Result<T, E> and functional programming patterns.
 * Use this instead of throwing errors for recoverable failures.
 *
 * @example
 * // In API layer
 * async function fetchUser(id: string): Promise<Result<User, AppError>> {
 *   try {
 *     const user = await api.getUser(id);
 *     return Result.ok(user);
 *   } catch (error) {
 *     return Result.err(AppError.from(error, 'FETCH_FAILED'));
 *   }
 * }
 *
 * // In consuming code
 * const result = await fetchUser('123');
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Successful result containing data.
 */
export interface Success<T> {
  readonly ok: true;
  readonly data: T;
  readonly error?: never;
}

/**
 * Failed result containing an error.
 */
export interface Failure<E> {
  readonly ok: false;
  readonly data?: never;
  readonly error: E;
}

/**
 * Discriminated union representing either success or failure.
 */
export type Result<T, E = AppError> = Success<T> | Failure<E>;

/**
 * Extract the success type from a Result.
 */
export type ResultData<R> = R extends Result<infer T, unknown> ? T : never;

/**
 * Extract the error type from a Result.
 */
export type ResultError<R> = R extends Result<unknown, infer E> ? E : never;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for categorizing application errors.
 */
export type ErrorCode =
  // Network & API errors
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  // Validation errors
  | 'VALIDATION_ERROR'
  | 'INVALID_INPUT'
  // Business logic errors
  | 'BOOKING_UNAVAILABLE'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'
  | 'INSUFFICIENT_FUNDS'
  | 'HOLD_EXPIRED'
  // Auth errors
  | 'AUTH_REQUIRED'
  | 'SESSION_EXPIRED'
  | 'INVALID_CREDENTIALS'
  // Generic errors
  | 'UNKNOWN'
  | 'INTERNAL_ERROR';

/**
 * Structured application error with code, message, and optional context.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options?: {
      context?: Record<string, unknown>;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = options?.context;
    this.cause = options?.cause;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Create an AppError from an unknown error value.
   */
  static from(error: unknown, code: ErrorCode = 'UNKNOWN'): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      return new AppError(code, error.message, { cause: error });
    }

    if (typeof error === 'string') {
      return new AppError(code, error);
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return new AppError(code, error.message, { cause: error });
    }

    return new AppError(code, 'An unexpected error occurred', { cause: error });
  }

  /**
   * Create an AppError from a Supabase error response.
   */
  static fromSupabase(
    error: { message: string; code?: string; details?: string } | null,
    fallbackMessage = 'Database operation failed',
  ): AppError {
    if (!error) {
      return new AppError('UNKNOWN', fallbackMessage);
    }

    // Map Supabase error codes to our error codes
    const code = mapSupabaseErrorCode(error.code);

    return new AppError(code, error.message || fallbackMessage, {
      context: { supabaseCode: error.code, details: error.details },
      cause: error,
    });
  }

  /**
   * Check if this error matches a specific code.
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Check if this error is any of the given codes.
   */
  isAny(...codes: ErrorCode[]): boolean {
    return codes.includes(this.code);
  }

  /**
   * Convert to a plain object for logging/serialization.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

/**
 * Map Supabase/PostgreSQL error codes to AppError codes.
 */
function mapSupabaseErrorCode(code: string | undefined): ErrorCode {
  if (!code) return 'API_ERROR';

  // PostgreSQL error codes
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (code === '23505') return 'VALIDATION_ERROR'; // unique_violation
  if (code === '23503') return 'VALIDATION_ERROR'; // foreign_key_violation
  if (code === '23502') return 'VALIDATION_ERROR'; // not_null_violation
  if (code === '42501') return 'FORBIDDEN'; // insufficient_privilege
  if (code === 'PGRST116') return 'NOT_FOUND'; // Row not found

  // Supabase Auth error codes
  if (code === 'invalid_credentials') return 'INVALID_CREDENTIALS';
  if (code === 'user_not_found') return 'NOT_FOUND';
  if (code === 'email_not_confirmed') return 'AUTH_REQUIRED';

  return 'API_ERROR';
}

// ============================================================================
// Result Factory Functions
// ============================================================================

/**
 * Factory object for creating Result values.
 */
export const Result = {
  /**
   * Create a successful Result.
   */
  ok<T>(data: T): Success<T> {
    return { ok: true, data };
  },

  /**
   * Create a failed Result.
   */
  err<E = AppError>(error: E): Failure<E> {
    return { ok: false, error };
  },

  /**
   * Create a failed Result from an unknown error.
   */
  fromError(error: unknown, code: ErrorCode = 'UNKNOWN'): Failure<AppError> {
    return { ok: false, error: AppError.from(error, code) };
  },

  /**
   * Create a failed Result from a Supabase error.
   */
  fromSupabaseError(
    error: { message: string; code?: string; details?: string } | null,
    fallbackMessage?: string,
  ): Failure<AppError> {
    return { ok: false, error: AppError.fromSupabase(error, fallbackMessage) };
  },

  /**
   * Check if a value is a Result type.
   */
  isResult<T, E>(value: unknown): value is Result<T, E> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'ok' in value &&
      typeof value.ok === 'boolean'
    );
  },
} as const;

// ============================================================================
// Result Helper Functions
// ============================================================================

/**
 * Type guard for successful results.
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok;
}

/**
 * Type guard for failed results.
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return !result.ok;
}

/**
 * Extract the data from a successful result, or throw if failed.
 *
 * Use sparingly - prefer pattern matching with isOk/isErr.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.data;
  }
  throw result.error;
}

/**
 * Extract the data from a successful result, or return a default value.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.ok ? result.data : defaultValue;
}

/**
 * Extract the error from a failed result, or return undefined.
 */
export function getError<T, E>(result: Result<T, E>): E | undefined {
  return result.ok ? undefined : result.error;
}

/**
 * Map the success value of a Result.
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  return result.ok ? Result.ok(fn(result.data)) : result;
}

/**
 * Map the error value of a Result.
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Result.err(fn(result.error));
}

/**
 * Chain Result-returning operations.
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.data) : result;
}

// ============================================================================
// Async Helpers
// ============================================================================

/**
 * Wrap an async operation in a Result, catching any thrown errors.
 *
 * @example
 * const result = await tryCatch(
 *   () => fetch('/api/user'),
 *   'NETWORK_ERROR'
 * );
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorCode: ErrorCode = 'UNKNOWN',
): Promise<Result<T, AppError>> {
  try {
    const data = await fn();
    return Result.ok(data);
  } catch (error) {
    return Result.fromError(error, errorCode);
  }
}

/**
 * Wrap a sync operation in a Result, catching any thrown errors.
 */
export function tryCatchSync<T>(
  fn: () => T,
  errorCode: ErrorCode = 'UNKNOWN',
): Result<T, AppError> {
  try {
    const data = fn();
    return Result.ok(data);
  } catch (error) {
    return Result.fromError(error, errorCode);
  }
}

// ============================================================================
// User-Facing Error Messages
// ============================================================================

/**
 * Get a user-friendly error message from an AppError.
 *
 * Maps technical error codes to human-readable messages.
 */
export function getUserErrorMessage(error: AppError, fallback = 'Something went wrong.'): string {
  // Use the error's message if it's already user-friendly
  const message = error.message;

  // Check if the message looks technical (contains codes, stack traces, etc.)
  if (isTechnicalMessage(message)) {
    return getDefaultMessageForCode(error.code) ?? fallback;
  }

  return message;
}

function isTechnicalMessage(message: string): boolean {
  // Heuristics for detecting technical error messages
  return (
    message.includes('PGRST') ||
    message.includes('TypeError') ||
    message.includes('SyntaxError') ||
    message.includes(' at ') || // Stack traces
    message.startsWith('Error:') ||
    /^[A-Z_]+$/.test(message) // All caps error codes
  );
}

function getDefaultMessageForCode(code: ErrorCode): string | undefined {
  const messages: Partial<Record<ErrorCode, string>> = {
    NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
    TIMEOUT: 'The request timed out. Please try again.',
    UNAUTHORIZED: 'Please sign in to continue.',
    FORBIDDEN: "You don't have permission to do this.",
    NOT_FOUND: 'The requested item was not found.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    BOOKING_UNAVAILABLE: 'This property is no longer available for the selected dates.',
    PAYMENT_FAILED: 'Payment could not be processed. Please try again.',
    PAYMENT_CANCELLED: 'Payment was cancelled.',
    HOLD_EXPIRED: 'Your booking hold has expired. Please start over.',
    AUTH_REQUIRED: 'Please sign in to continue.',
    SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
  };

  return messages[code];
}
