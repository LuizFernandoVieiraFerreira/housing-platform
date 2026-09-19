import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

import { fetchUnreadNotificationCount } from '@/features/notifications/api/notifications-api';
import { SupabaseAdapter } from '@/shared/api/adapters/supabase-adapter';
import { resetApiClients } from '@/shared/api/client';

describe('supabase adapter parity', () => {
  beforeEach(() => {
    resetApiClients();
    rpcMock.mockReset();
  });

  it('keeps the unread-count query on the same Supabase RPC when the adapter is selected', async () => {
    rpcMock.mockResolvedValue({ data: 4, error: null });
    const request = vi.spyOn(SupabaseAdapter.prototype, 'request');

    await expect(fetchUnreadNotificationCount()).resolves.toBe(4);

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/notifications/unread-count',
      }),
    );
    expect(rpcMock).toHaveBeenCalledWith('get_unread_notification_count');
    request.mockRestore();
  });
});
