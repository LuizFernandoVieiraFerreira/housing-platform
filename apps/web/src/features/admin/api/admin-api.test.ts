import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import { fetchAdminDashboardStats } from '@/features/admin/api/admin-api';

function mockCountQuery(count: number, error: unknown = null) {
  const result = { count, error };
  const chain = {
    eq: vi.fn(() => chain),
    in: vi.fn(() => Promise.resolve(result)),
    is: vi.fn(() => Promise.resolve(result)),
  };

  return {
    select: vi.fn(() => chain),
  };
}

describe('admin-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  describe('fetchAdminDashboardStats', () => {
    it('aggregates pending counts from all tables', async () => {
      fromMock
        .mockReturnValueOnce(mockCountQuery(2))
        .mockReturnValueOnce(mockCountQuery(1))
        .mockReturnValueOnce(mockCountQuery(3))
        .mockReturnValueOnce(mockCountQuery(4));

      await expect(fetchAdminDashboardStats()).resolves.toEqual({
        pendingProperties: 2,
        pendingHosts: 1,
        openBookings: 3,
        openHousingRequests: 4,
      });
    });

    it('propagates supabase errors', async () => {
      fromMock
        .mockReturnValueOnce(mockCountQuery(0, { message: 'Database unavailable' }))
        .mockReturnValueOnce(mockCountQuery(0))
        .mockReturnValueOnce(mockCountQuery(0))
        .mockReturnValueOnce(mockCountQuery(0));

      await expect(fetchAdminDashboardStats()).rejects.toThrow('Database unavailable');
    });
  });
});
