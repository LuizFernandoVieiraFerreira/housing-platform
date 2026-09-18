import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { fetchChannelBoot, getChannelPluginKey } from '@/features/support/api/channel-api';
import { mapChannelBootResult } from '@/features/support/api/mappers';

describe('support channel api', () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.unstubAllEnvs();
  });

  describe('getChannelPluginKey', () => {
    it('returns trimmed plugin key from env', () => {
      vi.stubEnv('VITE_CHANNEL_PLUGIN_KEY', '  plugin-key-123  ');

      expect(getChannelPluginKey()).toBe('plugin-key-123');
    });

    it('returns null when env is missing', () => {
      vi.stubEnv('VITE_CHANNEL_PLUGIN_KEY', '');

      expect(getChannelPluginKey()).toBeNull();
    });
  });

  describe('mapChannelBootResult', () => {
    it('accepts valid boot payloads', () => {
      expect(
        mapChannelBootResult({
          pluginKey: 'plugin-key-123',
          memberId: 'user-1',
        }),
      ).toEqual({
        pluginKey: 'plugin-key-123',
        memberId: 'user-1',
      });
    });

    it('rejects invalid pluginKey types', () => {
      expect(mapChannelBootResult({ pluginKey: 123 })).toBeNull();
      expect(mapChannelBootResult(null)).toBeNull();
    });
  });

  describe('fetchChannelBoot', () => {
    it('returns mapped boot result on success', async () => {
      invokeMock.mockResolvedValue({
        data: {
          pluginKey: 'plugin-key-123',
          memberHash: 'hash-1',
        },
        error: null,
      });

      await expect(fetchChannelBoot()).resolves.toEqual({
        pluginKey: 'plugin-key-123',
        memberHash: 'hash-1',
      });

      expect(invokeMock).toHaveBeenCalledWith('channel-boot', { method: 'GET' });
    });

    it('throws when boot payload is invalid', async () => {
      invokeMock.mockResolvedValue({
        data: { pluginKey: 123 },
        error: null,
      });

      await expect(fetchChannelBoot()).rejects.toThrow('Unable to initialize chat support');
    });

    it('propagates function invoke errors', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: { message: 'Edge function unavailable' },
      });

      await expect(fetchChannelBoot()).rejects.toThrow('Edge function unavailable');
    });
  });
});
