import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '@/shared/lib/errors';

import { resetApiClients, getApiClient, readBackendConfig, registerApiRoute, resolveBackend } from './client';
import { clearSupabaseRoutes } from './adapters/supabase-adapter';

describe('api client', () => {
  afterEach(() => {
    resetApiClients();
    clearSupabaseRoutes();
  });

  describe('readBackendConfig', () => {
    it('defaults to the supabase adapter and the local REST base URL', () => {
      expect(readBackendConfig({})).toEqual({
        defaultBackend: 'supabase',
        apiBaseUrl: 'http://localhost:8000/api/v1',
        featureOverrides: {},
      });
    });

    it('reads the default backend, base URL, and per-feature overrides', () => {
      expect(
        readBackendConfig({
          VITE_BACKEND: ' Python ',
          VITE_API_BASE_URL: 'http://localhost:8000/api/v1/',
          VITE_BACKEND_PROPERTIES: 'python',
          VITE_BACKEND_BOOKINGS: 'supabase',
          VITE_BACKEND_AUTH: '',
        }),
      ).toEqual({
        defaultBackend: 'python',
        apiBaseUrl: 'http://localhost:8000/api/v1',
        featureOverrides: {
          properties: 'python',
          bookings: 'supabase',
        },
      });
    });

    it('rejects an unknown backend name', () => {
      expect(() => readBackendConfig({ VITE_BACKEND_HOSTS: 'go' })).toThrow(AppError);
      expect(() => readBackendConfig({ VITE_BACKEND_HOSTS: 'go' })).toThrow(/VITE_BACKEND_HOSTS/);
    });
  });

  describe('resolveBackend', () => {
    it('prefers a feature override over the default backend', () => {
      const config = readBackendConfig({
        VITE_BACKEND: 'supabase',
        VITE_BACKEND_PROPERTIES: 'java',
      });

      expect(resolveBackend('properties', config)).toBe('java');
      expect(resolveBackend('bookings', config)).toBe('supabase');
    });
  });

  describe('getApiClient', () => {
    it('returns the supabase adapter when no backend is configured', () => {
      const client = getApiClient('bookings', {});

      expect(client.kind).toBe('supabase');
    });

    it('returns a REST adapter for python, java, and node', () => {
      expect(getApiClient('properties', { VITE_BACKEND: 'python' }).kind).toBe('python');
      expect(getApiClient('admin', { VITE_BACKEND: 'java' }).kind).toBe('java');
      expect(getApiClient('notifications', { VITE_BACKEND: 'node' }).kind).toBe('node');
    });

    it('keeps a feature on supabase while the rest of the app uses python', () => {
      const env = {
        VITE_BACKEND: 'python',
        VITE_API_BASE_URL: 'http://127.0.0.1:8000/api/v1',
        VITE_BACKEND_BOOKINGS: 'supabase',
      };

      expect(getApiClient('properties', env).kind).toBe('python');
      expect(getApiClient('bookings', env).kind).toBe('supabase');
    });

    it('reuses a cached adapter for the same backend', () => {
      const first = getApiClient('properties');
      const second = getApiClient('bookings');

      expect(second).toBe(first);
    });

    it('creates a new adapter after the cache is reset', () => {
      const first = getApiClient('properties');
      resetApiClients();
      const second = getApiClient('properties');

      expect(second).not.toBe(first);
      expect(second.kind).toBe('supabase');
    });
  });

  describe('registerApiRoute', () => {
    it('dispatches the default backend through the registered Supabase handler', async () => {
      const loadProfile = registerApiRoute<{ id: string }>(
        'profile',
        'GET',
        '/profile',
        async () => ({ id: 'user-1' }),
      );

      await expect(loadProfile()).resolves.toEqual({ id: 'user-1' });
      expect(getApiClient('profile').kind).toBe('supabase');
    });
  });
});
