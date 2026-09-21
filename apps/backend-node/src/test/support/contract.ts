import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';

export const API_PREFIX = '/api/v1';

export const HTTP_METHODS = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
]);

export const REQUIRED_OPERATIONS: OperationKey[] = [
  { normalizedPath: '/api/v1/properties', method: 'get' },
  { normalizedPath: '/api/v1/properties', method: 'post' },
  { normalizedPath: '/api/v1/properties/{}', method: 'get' },
  { normalizedPath: '/api/v1/properties/{}/submit-review', method: 'post' },
  { normalizedPath: '/api/v1/properties/{}/location', method: 'post' },
  { normalizedPath: '/api/v1/bookings/quote', method: 'get' },
  { normalizedPath: '/api/v1/bookings', method: 'get' },
  { normalizedPath: '/api/v1/bookings', method: 'post' },
  { normalizedPath: '/api/v1/bookings/{}/cancel', method: 'post' },
  { normalizedPath: '/api/v1/bookings/{}/approve', method: 'post' },
  { normalizedPath: '/api/v1/bookings/{}/reject', method: 'post' },
  { normalizedPath: '/api/v1/payments/orders', method: 'post' },
  { normalizedPath: '/api/v1/payments/confirm', method: 'post' },
  { normalizedPath: '/api/v1/payments/webhook', method: 'post' },
  { normalizedPath: '/api/v1/hosts', method: 'post' },
  { normalizedPath: '/api/v1/hosts/me', method: 'get' },
  { normalizedPath: '/api/v1/admin/stats', method: 'get' },
  { normalizedPath: '/api/v1/notifications', method: 'get' },
  { normalizedPath: '/api/v1/notifications/unread-count', method: 'get' },
  { normalizedPath: '/api/v1/profile', method: 'get' },
  { normalizedPath: '/api/v1/profile', method: 'patch' },
];

export const CONTRACT_ERROR_CODES = new Set([
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'BOOKING_CONFLICT',
  'BOOKING_EXPIRED',
  'PAYMENT_FAILED',
  'PAYMENT_AMOUNT_MISMATCH',
  'EXTERNAL_SERVICE_ERROR',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
]);

export interface OperationKey {
  normalizedPath: string;
  method: string;
}

export function operationKeyToString(key: OperationKey): string {
  return `${key.method}:${key.normalizedPath}`;
}

export function repoRoot(): string {
  let current = resolve(__dirname);

  while (true) {
    if (existsSync(resolve(current, 'packages/api-contract/openapi.yaml'))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error('Could not locate packages/api-contract/openapi.yaml');
    }
    current = parent;
  }
}

export function canonicalOpenApiPath(): string {
  return resolve(repoRoot(), 'packages/api-contract/openapi.yaml');
}

export function loadCanonicalOpenApi(): Record<string, unknown> {
  const document = parseYaml(
    readFileSync(canonicalOpenApiPath(), 'utf8'),
  ) as unknown;

  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new TypeError('Expected OpenAPI document to be a mapping');
  }

  return document as Record<string, unknown>;
}

export function normalizePath(path: string): string {
  return path.replace(/\{[^}]+\}/g, '{}').replace(/:[^/]+/g, '{}');
}

export function listPathOperations(
  document: Record<string, unknown>,
): Map<string, string> {
  const paths = document.paths;
  if (!paths || typeof paths !== 'object' || Array.isArray(paths)) {
    return new Map();
  }

  const operations = new Map<string, string>();

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object' || Array.isArray(pathItem)) {
      continue;
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method) || typeof operation !== 'object') {
        continue;
      }

      const key = operationKeyToString({
        normalizedPath: normalizePath(path),
        method,
      });
      operations.set(key, path);
    }
  }

  return operations;
}

export function assertErrorEnvelope(body: Record<string, unknown>): void {
  const error = body.error;
  if (!error || typeof error !== 'object' || Array.isArray(error)) {
    throw new Error("Expected error envelope with 'error' object");
  }

  const keys = Object.keys(error);
  if (
    keys.length > 0 &&
    !keys.every((key) => ['code', 'message', 'details'].includes(key))
  ) {
    throw new Error(`Unexpected error keys: ${keys.join(', ')}`);
  }

  const code = (error as Record<string, unknown>).code;
  if (typeof code !== 'string' || !CONTRACT_ERROR_CODES.has(code)) {
    throw new Error(`Unexpected error code: ${String(code)}`);
  }

  const message = (error as Record<string, unknown>).message;
  if (typeof message !== 'string' || message.length === 0) {
    throw new Error('Expected non-empty error message');
  }

  const details = (error as Record<string, unknown>).details;
  if (details !== undefined && (typeof details !== 'object' || details === null)) {
    throw new Error('Expected error details to be an object');
  }
}
