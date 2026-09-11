interface LogContext {
  [key: string]: unknown;
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

export function logInfo(event: string, context: LogContext = {}): void {
  console.log(
    JSON.stringify({
      level: 'info',
      event,
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logError(event: string, error: unknown, context: LogContext = {}): void {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      error: serializeError(error),
      ...context,
      timestamp: new Date().toISOString(),
    }),
  );
}

export async function captureException(error: unknown, context: LogContext = {}): Promise<void> {
  logError('edge.exception', error, context);

  const dsn = Deno.env.get('SENTRY_DSN')?.trim();

  if (!dsn) {
    return;
  }

  try {
    const endpoint = new URL(dsn);
    const projectId = endpoint.pathname.replace('/', '');
    const sentryKey = endpoint.username;
    const host = endpoint.host;
    const payload = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      level: 'error',
      platform: 'javascript',
      timestamp: Date.now() / 1000,
      message: error instanceof Error ? error.message : String(error),
      extra: context,
    };

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${sentryKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (captureError) {
    logError('edge.sentry_capture_failed', captureError, context);
  }
}
