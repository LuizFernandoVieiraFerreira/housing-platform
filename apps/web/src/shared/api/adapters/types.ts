/**
 * Backend-agnostic API types.
 *
 * Feature `api/` modules call `getApiClient(feature).request(...)`.
 * They do not branch on `supabase` vs a REST backend. `client.ts` is the only
 * place that reads `VITE_BACKEND` and the per-feature overrides.
 */

export const BACKEND_KINDS = ['supabase', 'python', 'java', 'node'] as const;

export type BackendKind = (typeof BACKEND_KINDS)[number];

export const REST_BACKEND_KINDS = ['python', 'java', 'node'] as const;

export type RestBackendKind = (typeof REST_BACKEND_KINDS)[number];

export const DEFAULT_BACKEND: BackendKind = 'supabase';

/** Matches `VITE_API_BASE_URL` in the architecture plan. Paths are relative to this root. */
export const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

/**
 * Domains that can be pinned to a backend independently of `VITE_BACKEND`.
 * Override with `VITE_BACKEND_<FEATURE>`, for example `VITE_BACKEND_BOOKINGS=python`.
 */
export const API_FEATURES = [
  'auth',
  'properties',
  'bookings',
  'payments',
  'hosts',
  'admin',
  'notifications',
  'profile',
  'search',
] as const;

export type ApiFeature = (typeof API_FEATURES)[number];

export const API_FEATURE_ENV_KEYS = {
  auth: 'VITE_BACKEND_AUTH',
  properties: 'VITE_BACKEND_PROPERTIES',
  bookings: 'VITE_BACKEND_BOOKINGS',
  payments: 'VITE_BACKEND_PAYMENTS',
  hosts: 'VITE_BACKEND_HOSTS',
  admin: 'VITE_BACKEND_ADMIN',
  notifications: 'VITE_BACKEND_NOTIFICATIONS',
  profile: 'VITE_BACKEND_PROFILE',
  search: 'VITE_BACKEND_SEARCH',
} as const satisfies Record<ApiFeature, `VITE_BACKEND_${string}`>;

export type ApiFeatureEnvKey = (typeof API_FEATURE_ENV_KEYS)[ApiFeature];

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type QueryValue = string | number | boolean;

/**
 * Values read from `import.meta.env`. Every access in `client.ts` is a static
 * property so Vite can inline `VITE_*` variables at build time.
 */
export interface BackendEnv {
  VITE_BACKEND?: string;
  VITE_API_BASE_URL?: string;
  VITE_BACKEND_AUTH?: string;
  VITE_BACKEND_PROPERTIES?: string;
  VITE_BACKEND_BOOKINGS?: string;
  VITE_BACKEND_PAYMENTS?: string;
  VITE_BACKEND_HOSTS?: string;
  VITE_BACKEND_ADMIN?: string;
  VITE_BACKEND_NOTIFICATIONS?: string;
  VITE_BACKEND_PROFILE?: string;
  VITE_BACKEND_SEARCH?: string;
}

export interface BackendConfig {
  defaultBackend: BackendKind;
  apiBaseUrl: string;
  featureOverrides: Partial<Record<ApiFeature, BackendKind>>;
}

export interface AdapterRequest {
  method: HttpMethod;
  /**
   * Path relative to `/api/v1`. A leading slash is optional.
   * Interpolate with `params` using `{id}` or `:id`.
   */
  path: string;
  params?: Record<string, string | number>;
  /** Arrays are serialized as repeated query keys (`style=form`, `explode=true`). */
  query?: Record<string, QueryValue | QueryValue[] | null | undefined>;
  body?: unknown;
  /**
   * Public endpoint. REST backends still attach a Supabase JWT when one exists,
   * but a missing session is not an error.
   */
  anonymous?: boolean;
}

export interface BackendAdapter {
  readonly kind: BackendKind;
  request<T>(request: AdapterRequest): Promise<T>;
}

/** OpenAPI `ApiErrorResponse`. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function isBackendKind(value: string): value is BackendKind {
  return (BACKEND_KINDS as readonly string[]).includes(value);
}

export function isRestBackend(kind: BackendKind): kind is RestBackendKind {
  return kind !== 'supabase';
}

export function isApiFeature(value: string): value is ApiFeature {
  return (API_FEATURES as readonly string[]).includes(value);
}

function pathParamPattern(): RegExp {
  return /\{([A-Za-z_][A-Za-z0-9_]*)\}|:([A-Za-z_][A-Za-z0-9_]*)/g;
}

export function normalizeAdapterPath(path: string): string {
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const collapsed = withSlash.replace(/\/{2,}/g, '/');
  if (collapsed.length > 1 && collapsed.endsWith('/')) {
    return collapsed.slice(0, -1);
  }
  return collapsed;
}

/**
 * Replace `{id}` and `:id` segments. Unresolved placeholders are left in place
 * so callers can report the missing names.
 */
export function interpolateAdapterPath(
  path: string,
  params?: Record<string, string | number>,
): string {
  const normalized = normalizeAdapterPath(path);
  if (!params) {
    return normalized;
  }

  return normalized.replace(
    pathParamPattern(),
    (match, braceName: string | undefined, colonName: string | undefined) => {
      const key = braceName ?? colonName ?? '';
      const value = params[key];
      if (value === undefined || value === null || String(value) === '') {
        return match;
      }
      return encodeURIComponent(String(value));
    },
  );
}

export function missingAdapterPathParams(path: string): string[] {
  const names: string[] = [];
  for (const match of path.matchAll(pathParamPattern())) {
    const name = match[1] ?? match[2];
    if (name) {
      names.push(name);
    }
  }
  return names;
}
