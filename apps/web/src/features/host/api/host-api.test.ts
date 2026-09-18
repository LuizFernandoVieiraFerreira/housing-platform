import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, rpcMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

import { fetchCurrentHost, registerAsHost } from '@/features/host/api/host-api';

const hostRow = {
  id: 'host-1',
  profile_id: 'user-1',
  display_name: 'Seoul Stays',
  status: 'active' as const,
  verified_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('host-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
    getUserMock.mockReset();
  });

  describe('registerAsHost', () => {
    it('maps rpc response to host record', async () => {
      rpcMock.mockResolvedValue({ data: hostRow, error: null });

      await expect(registerAsHost('Seoul Stays')).resolves.toMatchObject({
        id: 'host-1',
        display_name: 'Seoul Stays',
      });
    });
  });

  describe('fetchCurrentHost', () => {
    it('returns null when user is not authenticated', async () => {
      getUserMock.mockResolvedValue({ data: { user: null }, error: null });

      await expect(fetchCurrentHost()).resolves.toBeNull();
    });

    it('returns mapped host profile when found', async () => {
      getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: hostRow, error: null }),
            }),
          }),
        }),
      });

      await expect(fetchCurrentHost()).resolves.toMatchObject({
        profile_id: 'user-1',
      });
    });
  });
});
