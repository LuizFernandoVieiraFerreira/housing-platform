import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@housing-platform/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/shared/lib/errors';

import {
  clearSupabaseRoutes,
  createSupabaseAdapter,
  registerSupabaseRoute,
} from './supabase-adapter';

const client = {} as SupabaseClient<Database>;

describe('supabase adapter', () => {
  afterEach(() => {
    clearSupabaseRoutes();
  });

  it('dispatches a registered route and passes extracted params', async () => {
    const handler = vi.fn().mockResolvedValue({ id: 'booking-1' });
    const adapter = createSupabaseAdapter(client, { isolated: true });
    adapter.register('POST', '/bookings/:id/cancel', handler);

    const result = await adapter.request<{ id: string }>({
      method: 'POST',
      path: '/bookings/{id}/cancel',
      params: { id: 'booking-1' },
      body: { reason: 'changed plans' },
    });

    expect(result).toEqual({ id: 'booking-1' });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        client,
        method: 'POST',
        path: '/bookings/booking-1/cancel',
        pattern: '/bookings/:id/cancel',
        params: { id: 'booking-1' },
        body: { reason: 'changed plans' },
        anonymous: false,
      }),
    );
  });

  it('prefers a static route over a parameterized one', async () => {
    const quote = vi.fn().mockResolvedValue({ total: 100 });
    const detail = vi.fn().mockResolvedValue({ id: 'quote' });
    const adapter = createSupabaseAdapter(client, { isolated: true });
    adapter.register('GET', '/bookings/:id', detail);
    adapter.register('GET', '/bookings/quote', quote);

    await adapter.request({ method: 'GET', path: '/bookings/quote', anonymous: true });

    expect(quote).toHaveBeenCalledOnce();
    expect(detail).not.toHaveBeenCalled();
  });

  it('uses handlers registered on the shared table', async () => {
    const handler = vi.fn().mockResolvedValue(['published']);
    registerSupabaseRoute('GET', '/properties', handler);

    const adapter = createSupabaseAdapter(client);
    await adapter.request({ method: 'GET', path: 'properties', anonymous: true });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('replaces a handler when the same route is registered again', async () => {
    const first = vi.fn().mockResolvedValue('first');
    const second = vi.fn().mockResolvedValue('second');
    const adapter = createSupabaseAdapter(client, { isolated: true });
    adapter.register('GET', '/profile', first);
    adapter.register('GET', '/profile', second);

    await expect(adapter.request({ method: 'GET', path: '/profile' })).resolves.toBe('second');
    expect(first).not.toHaveBeenCalled();
  });

  it('fails clearly when no handler is registered', async () => {
    const adapter = createSupabaseAdapter(client, { isolated: true });

    await expect(adapter.request({ method: 'GET', path: '/hosts/me' })).rejects.toMatchObject({
      code: 'API_ERROR',
      message: 'No Supabase handler is registered for GET /hosts/me.',
    });
  });

  it('wraps unexpected handler failures as AppError', async () => {
    const adapter = createSupabaseAdapter(client, { isolated: true });
    adapter.register('GET', '/profile', async () => {
      throw new Error('rpc failed');
    });

    await expect(adapter.request({ method: 'GET', path: '/profile' })).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it('preserves AppError thrown by a handler', async () => {
    const adapter = createSupabaseAdapter(client, { isolated: true });
    adapter.register('POST', '/bookings', async () => {
      throw new AppError('BOOKING_UNAVAILABLE', 'Those dates are taken');
    });

    await expect(adapter.request({ method: 'POST', path: '/bookings' })).rejects.toMatchObject({
      code: 'BOOKING_UNAVAILABLE',
      message: 'Those dates are taken',
    });
  });
});
