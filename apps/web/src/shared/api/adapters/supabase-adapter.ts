/**
 * Supabase transport behind the same `BackendAdapter` interface as REST.
 *
 * Route handlers translate an OpenAPI-shaped request into PostgREST, RPC, or
 * Edge Function calls. Register them with `registerSupabaseRoute`. Until a
 * route is registered, `request` fails with a clear error instead of guessing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@housing-platform/types';

import { AppError } from '@/shared/lib/errors';

import { supabase } from '../supabase';
import {
  type AdapterRequest,
  type BackendAdapter,
  type HttpMethod,
  interpolateAdapterPath,
  missingAdapterPathParams,
  normalizeAdapterPath,
  type QueryValue,
} from './types';

export interface SupabaseRouteContext {
  client: SupabaseClient<Database>;
  method: HttpMethod;
  /** Concrete path after `{param}` interpolation. */
  path: string;
  /** Pattern the handler was registered with, such as `/bookings/:id`. */
  pattern: string;
  params: Record<string, string>;
  query: Record<string, QueryValue | QueryValue[] | null | undefined>;
  body: unknown;
  anonymous: boolean;
}

export type SupabaseRouteHandler = (context: SupabaseRouteContext) => Promise<unknown>;

interface CompiledRoute {
  method: HttpMethod;
  pattern: string;
  keys: string[];
  regex: RegExp;
  staticSegments: number;
  handler: SupabaseRouteHandler;
}

const sharedRoutes: CompiledRoute[] = [];

export function registerSupabaseRoute(
  method: HttpMethod,
  path: string,
  handler: SupabaseRouteHandler,
): void {
  upsertRoute(sharedRoutes, method, path, handler);
}

/** Drops registered handlers. Intended for tests. */
export function clearSupabaseRoutes(): void {
  sharedRoutes.length = 0;
}

export function createSupabaseAdapter(
  client: SupabaseClient<Database> = supabase,
  options?: { isolated?: boolean },
): SupabaseAdapter {
  return new SupabaseAdapter(client, options?.isolated ? [] : sharedRoutes);
}

export class SupabaseAdapter implements BackendAdapter {
  readonly kind = 'supabase' as const;

  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly routes: CompiledRoute[],
  ) {}

  /** Adds a handler to this adapter's route table. */
  register(method: HttpMethod, path: string, handler: SupabaseRouteHandler): void {
    upsertRoute(this.routes, method, path, handler);
  }

  async request<T>(request: AdapterRequest): Promise<T> {
    const path = interpolateAdapterPath(request.path, request.params);
    const missing = missingAdapterPathParams(path);
    if (missing.length > 0) {
      throw new AppError('INVALID_INPUT', `Missing path params: ${missing.join(', ')}.`, {
        context: { path: request.path, missing },
      });
    }

    const match = matchRoute(this.routes, request.method, path);
    if (!match) {
      throw new AppError(
        'API_ERROR',
        `No Supabase handler is registered for ${request.method} ${path}.`,
        { context: { method: request.method, path } },
      );
    }

    const params = {
      ...match.params,
      ...stringifyParams(request.params),
    };

    try {
      const data = await match.route.handler({
        client: this.client,
        method: request.method,
        path,
        pattern: match.route.pattern,
        params,
        query: request.query ?? {},
        body: request.body,
        anonymous: request.anonymous === true,
      });
      return data as T;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw AppError.from(error, 'API_ERROR');
    }
  }
}

function upsertRoute(
  routes: CompiledRoute[],
  method: HttpMethod,
  path: string,
  handler: SupabaseRouteHandler,
): void {
  const compiled = compileRoute(method, path, handler);
  const index = routes.findIndex(
    (route) => route.method === compiled.method && route.pattern === compiled.pattern,
  );
  if (index >= 0) {
    routes[index] = compiled;
    return;
  }
  routes.push(compiled);
}

function compileRoute(
  method: HttpMethod,
  path: string,
  handler: SupabaseRouteHandler,
): CompiledRoute {
  const pattern = normalizeAdapterPath(path).replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, ':$1');
  const keys: string[] = [];
  let staticSegments = 0;

  const source = pattern
    .split('/')
    .map((segment) => {
      if (!segment) {
        return '';
      }
      if (segment.startsWith(':')) {
        const key = segment.slice(1);
        if (!key) {
          throw new AppError('INVALID_INPUT', `Invalid Supabase route pattern "${path}".`);
        }
        keys.push(key);
        return '([^/]+)';
      }
      staticSegments += 1;
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return {
    method,
    pattern,
    keys,
    regex: new RegExp(`^${source}$`),
    staticSegments,
    handler,
  };
}

function matchRoute(
  routes: CompiledRoute[],
  method: HttpMethod,
  path: string,
): { route: CompiledRoute; params: Record<string, string> } | null {
  const normalized = normalizeAdapterPath(path);
  let best: { route: CompiledRoute; params: Record<string, string>; index: number } | null = null;

  for (let index = 0; index < routes.length; index += 1) {
    const route = routes[index];
    if (!route || route.method !== method) {
      continue;
    }

    const matched = route.regex.exec(normalized);
    if (!matched) {
      continue;
    }

    const params: Record<string, string> = {};
    for (let keyIndex = 0; keyIndex < route.keys.length; keyIndex += 1) {
      const key = route.keys[keyIndex];
      if (key) {
        params[key] = decodeURIComponent(matched[keyIndex + 1] ?? '');
      }
    }

    if (
      !best ||
      route.staticSegments > best.route.staticSegments ||
      (route.staticSegments === best.route.staticSegments && index > best.index)
    ) {
      best = { route, params, index };
    }
  }

  if (!best) {
    return null;
  }

  return { route: best.route, params: best.params };
}

function stringifyParams(
  params: Record<string, string | number> | undefined,
): Record<string, string> {
  if (!params) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    result[key] = String(value);
  }
  return result;
}
