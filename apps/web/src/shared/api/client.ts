/**
 * Selects a backend adapter for a feature.
 *
 * ```bash
 * VITE_BACKEND=supabase          # supabase | python | java | node
 * VITE_API_BASE_URL=http://localhost:8000/api/v1
 * VITE_BACKEND_PROPERTIES=python # optional per-feature override
 * ```
 *
 * Feature modules import `getApiClient`. Components must not branch on backend.
 *
 * @example
 * const properties = await getApiClient('properties').request<PropertySearchResult>({
 *   method: 'GET',
 *   path: '/properties',
 *   query: { guests: 2 },
 *   anonymous: true,
 * });
 */

import { AppError } from '@/shared/lib/errors';

import { createRestAdapter } from './adapters/rest-adapter';
import {
  createSupabaseAdapter,
  registerSupabaseRoute,
  type SupabaseRouteHandler,
} from './adapters/supabase-adapter';
import {
  type AdapterRequest,
  type ApiFeature,
  type BackendAdapter,
  type BackendConfig,
  type BackendEnv,
  type BackendKind,
  type HttpMethod,
  DEFAULT_API_BASE_URL,
  DEFAULT_BACKEND,
  isBackendKind,
} from './adapters/types';

export type {
  AdapterRequest,
  ApiFeature,
  BackendAdapter,
  BackendConfig,
  BackendEnv,
  BackendKind,
  HttpMethod,
} from './adapters/types';

const adapters = new Map<string, BackendAdapter>();

export function readBackendConfig(env: BackendEnv = readImportMetaBackendEnv()): BackendConfig {
  const defaultBackend = parseBackendKind(env.VITE_BACKEND, 'VITE_BACKEND') ?? DEFAULT_BACKEND;
  const apiBaseUrl = (env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

  return {
    defaultBackend,
    apiBaseUrl,
    featureOverrides: omitUnset({
      auth: parseBackendKind(env.VITE_BACKEND_AUTH, 'VITE_BACKEND_AUTH'),
      properties: parseBackendKind(env.VITE_BACKEND_PROPERTIES, 'VITE_BACKEND_PROPERTIES'),
      bookings: parseBackendKind(env.VITE_BACKEND_BOOKINGS, 'VITE_BACKEND_BOOKINGS'),
      payments: parseBackendKind(env.VITE_BACKEND_PAYMENTS, 'VITE_BACKEND_PAYMENTS'),
      hosts: parseBackendKind(env.VITE_BACKEND_HOSTS, 'VITE_BACKEND_HOSTS'),
      admin: parseBackendKind(env.VITE_BACKEND_ADMIN, 'VITE_BACKEND_ADMIN'),
      notifications: parseBackendKind(env.VITE_BACKEND_NOTIFICATIONS, 'VITE_BACKEND_NOTIFICATIONS'),
      profile: parseBackendKind(env.VITE_BACKEND_PROFILE, 'VITE_BACKEND_PROFILE'),
      search: parseBackendKind(env.VITE_BACKEND_SEARCH, 'VITE_BACKEND_SEARCH'),
    }),
  };
}

export function resolveBackend(feature: ApiFeature, config: BackendConfig): BackendKind {
  return config.featureOverrides[feature] ?? config.defaultBackend;
}

/**
 * Returns the adapter for `feature`. Adapters are cached by backend and base URL.
 * Pass `env` in tests to skip the cache and avoid reading `import.meta.env`.
 */
export function getApiClient(feature: ApiFeature, env?: BackendEnv): BackendAdapter {
  const config = readBackendConfig(env);
  const kind = resolveBackend(feature, config);

  if (env) {
    return createAdapter(kind, config);
  }

  const cacheKey = kind === 'supabase' ? 'supabase' : `${kind}:${config.apiBaseUrl}`;
  const cached = adapters.get(cacheKey);
  if (cached) {
    return cached;
  }

  const created = createAdapter(kind, config);
  adapters.set(cacheKey, created);
  return created;
}

/** Drops cached adapters. Does not unregister Supabase route handlers. */
export function resetApiClients(): void {
  adapters.clear();
}

type ApiRouteCall<T> = (
  request?: Partial<Pick<AdapterRequest, 'params' | 'query' | 'body' | 'anonymous'>>,
) => Promise<T>;

/**
 * Registers the Supabase implementation of an API route and returns the caller
 * feature modules export. The caller always goes through `getApiClient`, so the
 * default `supabase` backend keeps the handler's PostgREST, RPC, or Edge
 * Function behavior.
 */
export function registerApiRoute<T>(
  feature: ApiFeature,
  method: HttpMethod,
  path: string,
  handler: SupabaseRouteHandler,
): ApiRouteCall<T> {
  registerSupabaseRoute(method, path, handler);

  return (request) =>
    getApiClient(feature).request<T>({
      method,
      path,
      params: request?.params,
      query: request?.query,
      body: request?.body,
      anonymous: request?.anonymous,
    });
}

function createAdapter(kind: BackendKind, config: BackendConfig): BackendAdapter {
  if (kind === 'supabase') {
    return createSupabaseAdapter();
  }
  return createRestAdapter({ kind, baseUrl: config.apiBaseUrl });
}

function readImportMetaBackendEnv(): BackendEnv {
  return {
    VITE_BACKEND: import.meta.env.VITE_BACKEND,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_BACKEND_AUTH: import.meta.env.VITE_BACKEND_AUTH,
    VITE_BACKEND_PROPERTIES: import.meta.env.VITE_BACKEND_PROPERTIES,
    VITE_BACKEND_BOOKINGS: import.meta.env.VITE_BACKEND_BOOKINGS,
    VITE_BACKEND_PAYMENTS: import.meta.env.VITE_BACKEND_PAYMENTS,
    VITE_BACKEND_HOSTS: import.meta.env.VITE_BACKEND_HOSTS,
    VITE_BACKEND_ADMIN: import.meta.env.VITE_BACKEND_ADMIN,
    VITE_BACKEND_NOTIFICATIONS: import.meta.env.VITE_BACKEND_NOTIFICATIONS,
    VITE_BACKEND_PROFILE: import.meta.env.VITE_BACKEND_PROFILE,
    VITE_BACKEND_SEARCH: import.meta.env.VITE_BACKEND_SEARCH,
  };
}

function parseBackendKind(value: string | undefined, source: string): BackendKind | undefined {
  if (value == null) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (!isBackendKind(normalized)) {
    throw new AppError(
      'INVALID_INPUT',
      `Invalid ${source} "${value}". Expected one of: supabase, python, java, node.`,
    );
  }

  return normalized;
}

function omitUnset(
  overrides: Record<ApiFeature, BackendKind | undefined>,
): Partial<Record<ApiFeature, BackendKind>> {
  const result: Partial<Record<ApiFeature, BackendKind>> = {};
  for (const [feature, backend] of Object.entries(overrides)) {
    if (backend) {
      result[feature as ApiFeature] = backend;
    }
  }
  return result;
}
