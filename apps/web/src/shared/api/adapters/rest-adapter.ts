/**
 * REST transport for the Python, Java, and Node backends.
 *
 * All three implement the same OpenAPI contract, so they share this client.
 * The caller selects which process to hit via `VITE_API_BASE_URL`.
 * Protected calls send `Authorization: Bearer <supabase_jwt>`.
 */

import { AppError, type ErrorCode, wrapSupabaseError } from '@/shared/lib/errors';
import { logger } from '@/shared/lib/logger';

import { supabase } from '../supabase';
import {
  type AdapterRequest,
  type ApiErrorBody,
  type BackendAdapter,
  interpolateAdapterPath,
  missingAdapterPathParams,
  type RestBackendKind,
} from './types';

const log = logger.child('rest-adapter');

const OPENAPI_ERROR_CODES: Record<string, ErrorCode> = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  BOOKING_CONFLICT: 'BOOKING_UNAVAILABLE',
  BOOKING_EXPIRED: 'HOLD_EXPIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_AMOUNT_MISMATCH: 'PAYMENT_FAILED',
  EXTERNAL_SERVICE_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export type AccessTokenProvider = () => Promise<string | null>;

export interface RestAdapterOptions {
  kind: RestBackendKind;
  baseUrl: string;
  fetchFn?: typeof fetch;
  getAccessToken?: AccessTokenProvider;
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw wrapSupabaseError(error, 'Unable to read the current session');
  }
  return data.session?.access_token ?? null;
}

export function createRestAdapter(options: RestAdapterOptions): RestAdapter {
  return new RestAdapter(options);
}

export class RestAdapter implements BackendAdapter {
  readonly kind: RestBackendKind;
  readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly getAccessToken: AccessTokenProvider;

  constructor(options: RestAdapterOptions) {
    this.kind = options.kind;
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.fetchFn = options.fetchFn ?? fetch;
    this.getAccessToken = options.getAccessToken ?? getSupabaseAccessToken;
  }

  async request<T>(request: AdapterRequest): Promise<T> {
    const path = resolvePath(request);
    const url = appendQuery(joinUrl(this.baseUrl, path), request.query);
    const token = await resolveAccessToken(request.anonymous === true, this.getAccessToken);

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (request.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, {
        method: request.method,
        headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body),
        credentials: 'omit',
      });
    } catch (error) {
      const appError = new AppError('NETWORK_ERROR', 'Unable to reach the server.', {
        cause: error,
        context: { backend: this.kind, method: request.method, path },
      });
      log.error('REST request failed', { action: 'request', error: appError });
      throw appError;
    }

    if (!response.ok) {
      const appError = await errorFromResponse(response, {
        backend: this.kind,
        method: request.method,
        path,
      });
      log.error('REST request failed', { action: 'request', error: appError });
      throw appError;
    }

    return readSuccessBody<T>(response);
  }
}

function resolvePath(request: AdapterRequest): string {
  const path = interpolateAdapterPath(request.path, request.params);
  const missing = missingAdapterPathParams(path);
  if (missing.length > 0) {
    throw new AppError('INVALID_INPUT', `Missing path params: ${missing.join(', ')}.`, {
      context: { path: request.path, missing },
    });
  }
  return path;
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new AppError('INVALID_INPUT', 'VITE_API_BASE_URL is empty.');
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AppError('INVALID_INPUT', `Invalid VITE_API_BASE_URL "${baseUrl}".`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError('INVALID_INPUT', 'VITE_API_BASE_URL must be an http(s) URL.');
  }

  return trimmed;
}

function joinUrl(baseUrl: string, path: string): string {
  let relative = path;
  if (baseUrl.endsWith('/api/v1') && (relative === '/api/v1' || relative.startsWith('/api/v1/'))) {
    relative = relative.slice('/api/v1'.length) || '/';
  }
  return `${baseUrl}${relative}`;
}

function appendQuery(url: string, query: AdapterRequest['query']): string {
  if (!query) {
    return url;
  }

  const search = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (raw == null) {
      continue;
    }
    const values = Array.isArray(raw) ? raw : [raw];
    for (const value of values) {
      if (value == null) {
        continue;
      }
      search.append(key, String(value));
    }
  }

  const serialized = search.toString();
  return serialized ? `${url}?${serialized}` : url;
}

async function resolveAccessToken(
  anonymous: boolean,
  getAccessToken: AccessTokenProvider,
): Promise<string | null> {
  let token: string | null;
  try {
    token = await getAccessToken();
  } catch (error) {
    throw AppError.from(error, 'AUTH_REQUIRED');
  }

  if (!token && !anonymous) {
    throw new AppError('AUTH_REQUIRED', 'Sign in to continue.');
  }

  return token;
}

async function readSuccessBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new AppError('API_ERROR', 'The server returned an unreadable response.', {
      cause: error,
      context: { status: response.status },
    });
  }
}

async function errorFromResponse(
  response: Response,
  context: { backend: RestBackendKind; method: string; path: string },
): Promise<AppError> {
  const body = await readErrorBody(response);
  if (body) {
    return new AppError(mapErrorCode(body.error.code, response.status), body.error.message, {
      context: {
        ...context,
        status: response.status,
        apiCode: body.error.code,
        details: body.error.details,
      },
      cause: body,
    });
  }

  return new AppError(statusToErrorCode(response.status), messageForStatus(response.status), {
    context: { ...context, status: response.status },
  });
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const body: unknown = await response.json();
    if (!isApiErrorBody(body)) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const error = value.error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const record = error as Record<string, unknown>;
  return (
    typeof record.code === 'string' &&
    typeof record.message === 'string' &&
    record.message.length > 0
  );
}

function mapErrorCode(code: string, status: number): ErrorCode {
  return OPENAPI_ERROR_CODES[code] ?? statusToErrorCode(status);
}

function statusToErrorCode(status: number): ErrorCode {
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'BOOKING_UNAVAILABLE';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'INTERNAL_ERROR';
  return 'API_ERROR';
}

function messageForStatus(status: number): string {
  if (status === 401) return 'Sign in to continue.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested resource was not found.';
  if (status === 429) return 'Too many requests. Try again shortly.';
  if (status >= 500) return 'The server could not complete the request.';
  return 'Request failed.';
}
