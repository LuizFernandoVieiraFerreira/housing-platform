import { describe, expect, it } from 'vitest';

import {
  AppError,
  flatMap,
  getError,
  getUserErrorMessage,
  isErr,
  isOk,
  mapError,
  mapResult,
  Result,
  tryCatch,
  tryCatchSync,
  unwrap,
  unwrapOr,
} from './result';

describe('Result', () => {
  describe('Result.ok', () => {
    it('creates a successful result', () => {
      const result = Result.ok('hello');

      expect(result.ok).toBe(true);
      expect(result.data).toBe('hello');
      expect(result.error).toBeUndefined();
    });

    it('works with complex types', () => {
      const data = { id: 1, name: 'test', items: [1, 2, 3] };
      const result = Result.ok(data);

      expect(result.ok).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe('Result.err', () => {
    it('creates a failed result', () => {
      const error = new AppError('API_ERROR', 'Something went wrong');
      const result = Result.err(error);

      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Result.fromError', () => {
    it('creates AppError from Error', () => {
      const result = Result.fromError(new Error('test error'), 'API_ERROR');

      expect(result.ok).toBe(false);
      expect(result.error).toBeInstanceOf(AppError);
      expect(result.error.message).toBe('test error');
      expect(result.error.code).toBe('API_ERROR');
    });

    it('creates AppError from string', () => {
      const result = Result.fromError('test error', 'VALIDATION_ERROR');

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('test error');
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates AppError from unknown', () => {
      const result = Result.fromError(42, 'UNKNOWN');

      expect(result.ok).toBe(false);
      expect(result.error.message).toBe('An unexpected error occurred');
      expect(result.error.code).toBe('UNKNOWN');
    });
  });

  describe('Result.isResult', () => {
    it('returns true for success result', () => {
      expect(Result.isResult(Result.ok('test'))).toBe(true);
    });

    it('returns true for failure result', () => {
      expect(Result.isResult(Result.err(new AppError('UNKNOWN', 'error')))).toBe(true);
    });

    it('returns false for non-results', () => {
      expect(Result.isResult(null)).toBe(false);
      expect(Result.isResult(undefined)).toBe(false);
      expect(Result.isResult('string')).toBe(false);
      expect(Result.isResult({ ok: 'not boolean' })).toBe(false);
    });
  });
});

describe('AppError', () => {
  describe('constructor', () => {
    it('creates error with code and message', () => {
      const error = new AppError('API_ERROR', 'Request failed');

      expect(error.name).toBe('AppError');
      expect(error.code).toBe('API_ERROR');
      expect(error.message).toBe('Request failed');
      expect(error).toBeInstanceOf(Error);
    });

    it('includes optional context', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', {
        context: { field: 'email', value: 'invalid' },
      });

      expect(error.context).toEqual({ field: 'email', value: 'invalid' });
    });

    it('includes optional cause', () => {
      const cause = new Error('Original error');
      const error = new AppError('API_ERROR', 'Wrapped error', { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe('from', () => {
    it('returns same AppError if already AppError', () => {
      const original = new AppError('API_ERROR', 'test');
      const result = AppError.from(original, 'UNKNOWN');

      expect(result).toBe(original);
    });

    it('converts Error to AppError', () => {
      const error = AppError.from(new TypeError('Type error'), 'VALIDATION_ERROR');

      expect(error.message).toBe('Type error');
      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('converts string to AppError', () => {
      const error = AppError.from('String error', 'API_ERROR');

      expect(error.message).toBe('String error');
      expect(error.code).toBe('API_ERROR');
    });

    it('handles objects with message property', () => {
      const error = AppError.from({ message: 'Object error', code: 123 }, 'API_ERROR');

      expect(error.message).toBe('Object error');
    });
  });

  describe('fromSupabase', () => {
    it('maps Supabase unique violation to VALIDATION_ERROR', () => {
      const error = AppError.fromSupabase({
        message: 'duplicate key value',
        code: '23505',
      });

      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('maps Supabase foreign key violation to VALIDATION_ERROR', () => {
      const error = AppError.fromSupabase({
        message: 'foreign key violation',
        code: '23503',
      });

      expect(error.code).toBe('VALIDATION_ERROR');
    });

    it('maps Supabase insufficient privilege to FORBIDDEN', () => {
      const error = AppError.fromSupabase({
        message: 'permission denied',
        code: '42501',
      });

      expect(error.code).toBe('FORBIDDEN');
    });

    it('uses fallback message when error is null', () => {
      const error = AppError.fromSupabase(null, 'Custom fallback');

      expect(error.message).toBe('Custom fallback');
    });
  });

  describe('is', () => {
    it('returns true for matching code', () => {
      const error = new AppError('PAYMENT_FAILED', 'Payment error');

      expect(error.is('PAYMENT_FAILED')).toBe(true);
    });

    it('returns false for non-matching code', () => {
      const error = new AppError('PAYMENT_FAILED', 'Payment error');

      expect(error.is('API_ERROR')).toBe(false);
    });
  });

  describe('isAny', () => {
    it('returns true if any code matches', () => {
      const error = new AppError('UNAUTHORIZED', 'Not logged in');

      expect(error.isAny('UNAUTHORIZED', 'FORBIDDEN')).toBe(true);
    });

    it('returns false if no codes match', () => {
      const error = new AppError('API_ERROR', 'Request failed');

      expect(error.isAny('UNAUTHORIZED', 'FORBIDDEN')).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('serializes error to plain object', () => {
      const error = new AppError('API_ERROR', 'Test error', {
        context: { endpoint: '/api/test' },
      });

      expect(error.toJSON()).toEqual({
        name: 'AppError',
        code: 'API_ERROR',
        message: 'Test error',
        context: { endpoint: '/api/test' },
      });
    });
  });
});

describe('Type guards', () => {
  describe('isOk', () => {
    it('returns true for success', () => {
      const result = Result.ok('test');

      expect(isOk(result)).toBe(true);
    });

    it('returns false for failure', () => {
      const result = Result.err(new AppError('UNKNOWN', 'error'));

      expect(isOk(result)).toBe(false);
    });

    it('narrows type correctly', () => {
      const result: Result<string> = Result.ok('hello');

      if (isOk(result)) {
        // TypeScript should know result.data is string here
        expect(result.data.toUpperCase()).toBe('HELLO');
      }
    });
  });

  describe('isErr', () => {
    it('returns true for failure', () => {
      const result = Result.err(new AppError('API_ERROR', 'error'));

      expect(isErr(result)).toBe(true);
    });

    it('returns false for success', () => {
      const result = Result.ok('test');

      expect(isErr(result)).toBe(false);
    });
  });
});

describe('Helper functions', () => {
  describe('unwrap', () => {
    it('returns data for success', () => {
      const result = Result.ok('hello');

      expect(unwrap(result)).toBe('hello');
    });

    it('throws for failure', () => {
      const error = new AppError('API_ERROR', 'test error');
      const result = Result.err(error);

      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    it('returns data for success', () => {
      const result = Result.ok('hello');

      expect(unwrapOr(result, 'default')).toBe('hello');
    });

    it('returns default for failure', () => {
      const result = Result.err(new AppError('UNKNOWN', 'error'));

      expect(unwrapOr(result, 'default')).toBe('default');
    });
  });

  describe('getError', () => {
    it('returns error for failure', () => {
      const error = new AppError('API_ERROR', 'test');
      const result = Result.err(error);

      expect(getError(result)).toBe(error);
    });

    it('returns undefined for success', () => {
      const result = Result.ok('test');

      expect(getError(result)).toBeUndefined();
    });
  });

  describe('mapResult', () => {
    it('transforms success value', () => {
      const result = Result.ok(5);
      const mapped = mapResult(result, (n) => n * 2);

      expect(isOk(mapped) && mapped.data).toBe(10);
    });

    it('passes through failure', () => {
      const error = new AppError('API_ERROR', 'error');
      const result = Result.err<AppError>(error);
      const mapped = mapResult(result, (n: number) => n * 2);

      expect(isErr(mapped) && mapped.error).toBe(error);
    });
  });

  describe('mapError', () => {
    it('transforms error value', () => {
      const result = Result.err(new AppError('API_ERROR', 'original'));
      const mapped = mapError(result, (e) => new AppError('UNKNOWN', `Wrapped: ${e.message}`));

      expect(isErr(mapped) && mapped.error.message).toBe('Wrapped: original');
    });

    it('passes through success', () => {
      const result = Result.ok('test');
      const mapped = mapError(result, () => new AppError('UNKNOWN', 'should not run'));

      expect(isOk(mapped) && mapped.data).toBe('test');
    });
  });

  describe('flatMap', () => {
    it('chains successful operations', () => {
      const result = Result.ok(5);
      const chained = flatMap(result, (n) => Result.ok(n * 2));

      expect(isOk(chained) && chained.data).toBe(10);
    });

    it('short-circuits on failure', () => {
      const error = new AppError('API_ERROR', 'first error');
      const result = Result.err<AppError>(error);
      const chained = flatMap(result, (_n: number) => Result.ok('should not reach'));

      expect(isErr(chained) && chained.error).toBe(error);
    });

    it('propagates new failure', () => {
      const result = Result.ok(5);
      const error = new AppError('VALIDATION_ERROR', 'too small');
      const chained = flatMap(result, (n) =>
        n < 10 ? Result.err(error) : Result.ok(n),
      );

      expect(isErr(chained) && chained.error).toBe(error);
    });
  });
});

describe('Async helpers', () => {
  describe('tryCatch', () => {
    it('returns success for resolved promise', async () => {
      const result = await tryCatch(() => Promise.resolve('hello'));

      expect(result.ok).toBe(true);
      expect(isOk(result) && result.data).toBe('hello');
    });

    it('returns failure for rejected promise', async () => {
      const result = await tryCatch(
        () => Promise.reject(new Error('async error')),
        'API_ERROR',
      );

      expect(result.ok).toBe(false);
      expect(isErr(result) && result.error.message).toBe('async error');
      expect(isErr(result) && result.error.code).toBe('API_ERROR');
    });
  });

  describe('tryCatchSync', () => {
    it('returns success for non-throwing function', () => {
      const result = tryCatchSync(() => 'hello');

      expect(result.ok).toBe(true);
      expect(isOk(result) && result.data).toBe('hello');
    });

    it('returns failure for throwing function', () => {
      const result = tryCatchSync(() => {
        throw new Error('sync error');
      }, 'INTERNAL_ERROR');

      expect(result.ok).toBe(false);
      expect(isErr(result) && result.error.message).toBe('sync error');
      expect(isErr(result) && result.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

describe('getUserErrorMessage', () => {
  it('returns error message for user-friendly messages', () => {
    const error = new AppError('API_ERROR', 'Please try again later');

    expect(getUserErrorMessage(error)).toBe('Please try again later');
  });

  it('returns default message for technical errors', () => {
    const error = new AppError('API_ERROR', 'PGRST116: No rows found');

    expect(getUserErrorMessage(error, 'Not found')).toBe('Not found');
  });

  it('returns code-specific message for technical errors with known codes', () => {
    // Technical message (contains "Error:") triggers code-specific fallback
    const error = new AppError('UNAUTHORIZED', 'Error: JWT token validation failed');

    expect(getUserErrorMessage(error)).toBe('Please sign in to continue.');
  });

  it('preserves user-friendly message even with known codes', () => {
    // Non-technical messages are preserved as-is
    const error = new AppError('UNAUTHORIZED', 'Your session has expired');

    expect(getUserErrorMessage(error)).toBe('Your session has expired');
  });

  it('returns fallback for unknown technical errors', () => {
    const error = new AppError('UNKNOWN', 'TypeError: Cannot read property x');

    expect(getUserErrorMessage(error, 'Something went wrong')).toBe('Something went wrong');
  });

  it('handles PAYMENT_FAILED code', () => {
    const error = new AppError('PAYMENT_FAILED', 'Card declined');

    // Card declined is user-friendly, so it should be returned
    expect(getUserErrorMessage(error)).toBe('Card declined');
  });

  it('handles NETWORK_ERROR code with technical message', () => {
    const error = new AppError('NETWORK_ERROR', 'TypeError: Failed to fetch');

    expect(getUserErrorMessage(error)).toBe('Unable to connect. Please check your internet connection.');
  });
});
