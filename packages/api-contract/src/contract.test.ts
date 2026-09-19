import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';
import { describe, expect, it } from 'vitest';

import {
  apiErrorResponseSchema,
  bookingQuoteSchema,
  createBookingRequestSchema,
  hostPropertyRequestSchema,
  nullableHostSchema,
} from '../generated/index';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const openApiPath = path.join(packageRoot, 'openapi.yaml');

const requiredOperations: Array<[string, string]> = [
  ['/api/v1/properties', 'get'],
  ['/api/v1/properties', 'post'],
  ['/api/v1/properties/{id}', 'get'],
  ['/api/v1/properties/{id}/submit-review', 'post'],
  ['/api/v1/properties/{id}/location', 'post'],
  ['/api/v1/bookings/quote', 'get'],
  ['/api/v1/bookings', 'get'],
  ['/api/v1/bookings', 'post'],
  ['/api/v1/bookings/{id}/cancel', 'post'],
  ['/api/v1/bookings/{id}/approve', 'post'],
  ['/api/v1/bookings/{id}/reject', 'post'],
  ['/api/v1/payments/orders', 'post'],
  ['/api/v1/payments/confirm', 'post'],
  ['/api/v1/payments/webhook', 'post'],
  ['/api/v1/hosts', 'post'],
  ['/api/v1/hosts/me', 'get'],
  ['/api/v1/admin/stats', 'get'],
  ['/api/v1/notifications', 'get'],
  ['/api/v1/notifications/unread-count', 'get'],
  ['/api/v1/profile', 'get'],
  ['/api/v1/profile', 'patch'],
];

const roomId = '11111111-1111-4111-8111-111111111111';

describe('OpenAPI contract', () => {
  it('is a valid OpenAPI 3.1 document covering the core operations', async () => {
    const document = await SwaggerParser.validate(openApiPath);
    if (!('openapi' in document) || !document.paths) {
      throw new Error('Expected an OpenAPI 3.1 document');
    }

    expect(document.openapi).toBe('3.1.0');

    for (const [route, method] of requiredOperations) {
      const pathItem = document.paths[route];
      expect(pathItem, route).toBeDefined();
      expect(
        pathItem && method in pathItem ? pathItem[method as keyof typeof pathItem] : undefined,
        `${method} ${route}`,
      ).toBeDefined();
    }
  });

  it('keeps generated Zod schemas in sync with openapi.yaml', () => {
    execFileSync('node', ['scripts/generate-zod.mjs', '--check'], {
      cwd: packageRoot,
      stdio: 'pipe',
    });
  });
});

describe('generated Zod schemas', () => {
  it('accepts the standard error envelope', () => {
    expect(
      apiErrorResponseSchema.parse({
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot cancel this booking',
          details: {},
        },
      }),
    ).toMatchObject({
      error: { code: 'FORBIDDEN' },
    });
  });

  it('rejects unknown error fields', () => {
    expect(
      apiErrorResponseSchema.safeParse({
        error: { code: 'FORBIDDEN', message: 'Cannot cancel this booking' },
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('validates booking and host request bodies', () => {
    expect(
      createBookingRequestSchema.parse({
        roomId,
        checkIn: '2026-10-01',
        checkOut: '2026-10-08',
        guestCount: 2,
      }).roomId,
    ).toBe(roomId);

    expect(
      hostPropertyRequestSchema.safeParse({
        title: 'Hanok stay',
        description: 'Too short',
        propertyType: 'studio',
        addressLine1: '1 Seoul-ro',
        city: 'Seoul',
        district: 'Jongno',
        bookingMode: 'request',
        minStayNights: 7,
      }).success,
    ).toBe(false);

    expect(nullableHostSchema.parse(null)).toBeNull();
  });

  it('validates a booking quote', () => {
    expect(
      bookingQuoteSchema.parse({
        roomId,
        propertyId: roomId,
        bookingMode: 'instant',
        nights: 7,
        rentKrw: 700000,
        serviceFeeKrw: 70000,
        totalKrw: 770000,
        pricingVersion: 'v1',
      }).totalKrw,
    ).toBe(770000);
  });
});
