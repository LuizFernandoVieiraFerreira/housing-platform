import { errorResponse } from './http.ts';

interface RateLimitOptions {
  bucket: string;
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitState>();

function getRequestKey(req: Request, bucket: string): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp =
    forwardedFor?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || 'unknown';
  return `${bucket}:${clientIp}`;
}

export function enforceRateLimit(
  req: Request,
  options: RateLimitOptions,
): { allowed: boolean; retryAfterMs: number } {
  const key = getRequestKey(req, options.bucket);
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return { allowed: true, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs = 60_000): Response {
  return errorResponse('RATE_LIMITED', 'Too many requests. Please try again shortly.', 429, {
    retryAfterMs,
  });
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
