import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTimer, logger, logApiCall, logTimed } from './logger';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  setTag: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('logs debug messages', () => {
      logger.debug('Debug message', { data: { key: 'value' } });

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[DEBUG]');
    });

    it('logs info messages', () => {
      logger.info('Info message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[INFO]');
    });

    it('logs warn messages', () => {
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalled();
      const callArgs = consoleWarnSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[WARN]');
    });

    it('logs error messages', () => {
      logger.error('Error message', { error: new Error('Test error') });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const callArgs = consoleErrorSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[ERROR]');
    });
  });

  describe('child logger', () => {
    it('creates a child logger with component context', () => {
      const childLog = logger.child('TestComponent');
      childLog.info('Child message');

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[TestComponent]');
    });

    it('inherits parent context', () => {
      const parentLog = logger.child('Parent');
      const childLog = parentLog.child('Child');
      childLog.info('Nested message');

      expect(consoleLogSpy).toHaveBeenCalled();
      // Child should have its own component name
      const callArgs = consoleLogSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('[Child]');
    });
  });

  describe('context formatting', () => {
    it('includes action in log output', () => {
      logger.info('Action message', { action: 'testAction' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const callArgs = consoleLogSpy.mock.calls[0]!;
      expect(callArgs[0]).toContain('testAction');
    });

    it('formats Error objects properly', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.ts:1:1';

      logger.error('Error occurred', { error });

      expect(consoleErrorSpy).toHaveBeenCalled();
      // In dev mode, context is passed as the 4th argument (index 3)
      // The format is: formatted message, style1, style2, style3, context
      const lastArg = consoleErrorSpy.mock.calls[0]!.at(-1) as { error: unknown };
      expect(lastArg.error).toEqual({
        name: 'Error',
        message: 'Test error',
        stack: error.stack,
      });
    });

    it('handles non-Error objects in error field', () => {
      logger.error('Error occurred', { error: { code: 'ERR_001', msg: 'fail' } });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const lastArg = consoleErrorSpy.mock.calls[0]!.at(-1) as { error: unknown };
      expect(lastArg.error).toEqual({ code: 'ERR_001', msg: 'fail' });
    });

    it('handles primitive values in error field', () => {
      logger.error('Error occurred', { error: 'string error' });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const lastArg = consoleErrorSpy.mock.calls[0]!.at(-1) as { error: unknown };
      expect(lastArg.error).toEqual({ value: 'string error' });
    });
  });
});

describe('createTimer', () => {
  it('returns elapsed time in milliseconds', async () => {
    const timer = createTimer();

    // Wait a small amount
    await new Promise((resolve) => setTimeout(resolve, 10));

    const elapsed = timer();
    expect(elapsed).toBeGreaterThanOrEqual(10);
    expect(elapsed).toBeLessThan(100); // Shouldn't take more than 100ms
  });

  it('returns integer values', () => {
    const timer = createTimer();
    const elapsed = timer();

    expect(Number.isInteger(elapsed)).toBe(true);
  });
});

describe('logApiCall', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs API call start', () => {
    logApiCall({ endpoint: '/api/users', method: 'GET', status: 'start' });

    expect(consoleLogSpy).toHaveBeenCalled();
    const callArgs = consoleLogSpy.mock.calls[0]!;
    expect(callArgs[0]).toContain('API call started');
  });

  it('logs API call success with duration', () => {
    logApiCall({
      endpoint: '/api/users',
      method: 'POST',
      status: 'success',
      duration: 150,
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    const callArgs = consoleLogSpy.mock.calls[0]!;
    expect(callArgs[0]).toContain('API call succeeded');
  });

  it('logs API call error', () => {
    logApiCall({
      endpoint: '/api/users',
      method: 'DELETE',
      status: 'error',
      error: new Error('Not found'),
      duration: 50,
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0]!;
    expect(callArgs[0]).toContain('API call failed');
  });

  it('defaults to GET method', () => {
    logApiCall({ endpoint: '/api/users', status: 'start' });

    const callArgs = consoleLogSpy.mock.calls[0]!;
    expect(callArgs[0]).toContain('GET /api/users');
  });
});

describe('logTimed', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs start and completion', async () => {
    const done = logTimed('Test operation', { component: 'TestComponent' });

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, 10));

    done();

    // Should have two log calls: start (debug) and complete (info)
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy.mock.calls[0]![0]).toContain('started');
    expect(consoleLogSpy.mock.calls[1]![0]).toContain('completed');
  });

  it('logs error when done is called with error', () => {
    const done = logTimed('Test operation');
    done({ error: new Error('Operation failed') });

    // Start log + error log
    expect(consoleLogSpy).toHaveBeenCalledTimes(1); // debug start
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // error completion
    expect(consoleErrorSpy.mock.calls[0]![0]).toContain('failed');
  });

  it('includes duration in completion log', async () => {
    const done = logTimed('Test operation');

    await new Promise((resolve) => setTimeout(resolve, 15));
    done();

    // Get the last argument of the completion log (context object)
    const completionContext = consoleLogSpy.mock.calls[1]!.at(-1) as {
      data: { durationMs: number };
    };
    expect(completionContext.data.durationMs).toBeGreaterThanOrEqual(10);
  });
});
