import { describe, expect, it, vi } from 'vitest';

import { AppError } from '@/shared/lib/errors';

import { createRestAdapter } from './rest-adapter';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('rest adapter', () => {
  it('sends the Supabase JWT and serializes query arrays', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ items: [] }));
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: 'http://localhost:8000/api/v1/',
      fetchFn,
      getAccessToken: async () => 'jwt-token',
    });

    await adapter.request({
      method: 'GET',
      path: '/properties',
      query: { guests: 2, amenitySlugs: ['wifi', 'washer'], priceMin: null },
      anonymous: true,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/properties?guests=2&amenitySlugs=wifi&amenitySlugs=washer',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        headers: expect.objectContaining({
          Accept: 'application/json',
          Authorization: 'Bearer jwt-token',
        }),
      }),
    );
  });

  it('interpolates path params and posts a JSON body', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ id: 'booking-1' }, 201));
    const adapter = createRestAdapter({
      kind: 'java',
      baseUrl: 'http://localhost:8080/api/v1',
      fetchFn,
      getAccessToken: async () => 'jwt-token',
    });

    const result = await adapter.request<{ id: string }>({
      method: 'POST',
      path: '/bookings/{id}/cancel',
      params: { id: 'booking-1' },
      body: { reason: 'changed plans' },
    });

    expect(result).toEqual({ id: 'booking-1' });
    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/bookings/booking-1/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ reason: 'changed plans' }),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('strips a duplicated /api/v1 prefix', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const adapter = createRestAdapter({
      kind: 'node',
      baseUrl: 'http://localhost:3000/api/v1',
      fetchFn,
      getAccessToken: async () => null,
    });

    await adapter.request({
      method: 'GET',
      path: '/api/v1/profile',
      anonymous: true,
    });

    expect(fetchFn).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/profile',
      expect.any(Object),
    );
  });

  it('does not require a session for anonymous requests', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: 'http://localhost:8000/api/v1',
      fetchFn,
      getAccessToken: async () => null,
    });

    await expect(
      adapter.request({ method: 'GET', path: '/amenities', anonymous: true }),
    ).resolves.toBeUndefined();
  });

  it('requires a session for protected requests', async () => {
    const fetchFn = vi.fn();
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: 'http://localhost:8000/api/v1',
      fetchFn,
      getAccessToken: async () => null,
    });

    await expect(adapter.request({ method: 'GET', path: '/profile' })).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('maps the OpenAPI error body onto AppError', async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot cancel this booking',
            details: { bookingId: 'booking-1' },
          },
        },
        403,
      ),
    );
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: 'http://localhost:8000/api/v1',
      fetchFn,
      getAccessToken: async () => 'jwt-token',
    });

    await expect(
      adapter.request({ method: 'POST', path: '/bookings/booking-1/cancel' }),
    ).rejects.toMatchObject({
      name: 'AppError',
      code: 'FORBIDDEN',
      message: 'Cannot cancel this booking',
      context: expect.objectContaining({
        apiCode: 'FORBIDDEN',
        status: 403,
        details: { bookingId: 'booking-1' },
      }),
    });
  });

  it('maps contract codes that the frontend names differently', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ error: { code: 'BOOKING_EXPIRED', message: 'Hold expired' } }, 409),
      );
    const adapter = createRestAdapter({
      kind: 'node',
      baseUrl: 'http://localhost:3000/api/v1',
      fetchFn,
      getAccessToken: async () => 'jwt-token',
    });

    const error = await adapter
      .request({ method: 'POST', path: '/payments/orders' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'HOLD_EXPIRED', message: 'Hold expired' });
  });

  it('uses the global fetch without illegal invocation', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: 'http://localhost:8000/api/v1',
      getAccessToken: async () => null,
    });

    await adapter.request({ method: 'GET', path: '/amenities', anonymous: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/amenities',
      expect.objectContaining({ method: 'GET' }),
    );
    fetchSpy.mockRestore();
  });

  it('reports a network failure when fetch throws', async () => {
    const adapter = createRestAdapter({
      kind: 'java',
      baseUrl: 'http://localhost:8080/api/v1',
      fetchFn: vi.fn().mockRejectedValue(new TypeError('failed to fetch')),
      getAccessToken: async () => null,
    });

    await expect(
      adapter.request({ method: 'GET', path: '/properties', anonymous: true }),
    ).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });

  it('rejects a missing path param before calling fetch', async () => {
    const fetchFn = vi.fn();
    const adapter = createRestAdapter({
      kind: 'python',
      baseUrl: '/api/v1',
      fetchFn,
      getAccessToken: async () => 'jwt-token',
    });

    await expect(
      adapter.request({ method: 'POST', path: '/bookings/{id}/cancel' }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
