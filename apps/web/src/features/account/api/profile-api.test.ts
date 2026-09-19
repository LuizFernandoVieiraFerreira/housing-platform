import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, getUserMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

import { fetchCurrentProfile, updateCurrentProfile } from '@/features/account/api/profile-api';

const profileRow = {
  id: 'user-1',
  role: 'customer' as const,
  full_name: 'Jane Doe',
  phone: '+821012345678',
  avatar_url: null,
  preferred_language: 'en',
  marketing_consent: true,
  deleted_at: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('profile-api', () => {
  beforeEach(() => {
    fromMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  describe('fetchCurrentProfile', () => {
    it('returns mapped profile when found', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: profileRow, error: null }),
          }),
        }),
      });

      await expect(fetchCurrentProfile('user-1')).resolves.toEqual(profileRow);
    });

    it('returns null when profile is missing', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });

      await expect(fetchCurrentProfile('user-1')).resolves.toBeNull();
    });

    it('propagates supabase errors', async () => {
      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database unavailable' },
            }),
          }),
        }),
      });

      await expect(fetchCurrentProfile('user-1')).rejects.toThrow('Database unavailable');
    });
  });

  describe('updateCurrentProfile', () => {
    it('updates profile and returns mapped row', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...profileRow, full_name: 'Updated Name' },
              error: null,
            }),
          }),
        }),
      });

      fromMock.mockReturnValue({ update: updateMock });

      const result = await updateCurrentProfile('user-1', {
        full_name: 'Updated Name',
        phone: '+821012345678',
        avatar_url: null,
        preferred_language: 'en',
        marketing_consent: false,
      });

      expect(result.full_name).toBe('Updated Name');
      expect(updateMock).toHaveBeenCalledWith({
        full_name: 'Updated Name',
        phone: '+821012345678',
        avatar_url: null,
        preferred_language: 'en',
        marketing_consent: false,
      });
    });

    it('throws when update returns no data', async () => {
      fromMock.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      });

      await expect(
        updateCurrentProfile('user-1', {
          full_name: 'Jane Doe',
          phone: null,
          avatar_url: null,
          preferred_language: 'en',
          marketing_consent: true,
        }),
      ).rejects.toThrow('Profile update returned no data');
    });
  });
});
