import { INestApplication } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BookingsController } from '../features/bookings/bookings.controller';
import { BookingService } from '../features/bookings/booking.service';
import { createAuthorizationTestApp } from './support/authorization-test-support';
import {
  API_PREFIX,
  assertErrorEnvelope,
  canonicalOpenApiPath,
  listPathOperations,
  loadCanonicalOpenApi,
  operationKeyToString,
  REQUIRED_OPERATIONS,
} from './support/contract';
import {
  listRequiredOperationKeys,
  scanNestOperations,
} from './support/nest-operation-scanner';

describe('contract', () => {
  it('canonical OpenAPI document is valid', () => {
    const document = loadCanonicalOpenApi();

    expect(document.openapi).toBe('3.1.0');
    expect(canonicalOpenApiPath()).toBeTruthy();
    expect(document.paths).toBeTypeOf('object');
  });

  it.each(REQUIRED_OPERATIONS)(
    'NestJS exposes required contract operation $method $normalizedPath',
    (operation) => {
      const operations = scanNestOperations();
      const key = operationKeyToString(operation);

      expect(operations.has(key)).toBe(true);
    },
  );

  it('NestJS paths are defined in the canonical contract', () => {
    const canonical = listPathOperations(loadCanonicalOpenApi());
    const nest = scanNestOperations();
    const undefinedRoutes: string[] = [];

    for (const [key, path] of nest) {
      if (key.endsWith('/health') || key.includes('/health:')) {
        continue;
      }

      if (!canonical.has(key)) {
        const [method] = key.split(':');
        undefinedRoutes.push(`${method.toUpperCase()} ${path}`);
      }
    }

    expect(undefinedRoutes).toEqual([]);
  });

  describe('error envelope', () => {
    let app: INestApplication;

    afterEach(async () => {
      if (app) {
        await app.close();
      }
    });

    it('unauthenticated error matches contract envelope', async () => {
      const testApp = await createAuthorizationTestApp({
        controllers: [BookingsController],
        providers: [
          { provide: BookingService, useValue: { listMyBookings: vi.fn() } },
        ],
      });

      app = testApp.app;

      const response = await testApp.request.get(`${API_PREFIX}/bookings`);

      expect(response.status).toBe(401);
      assertErrorEnvelope(response.body as Record<string, unknown>);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('validation error matches contract envelope', async () => {
      const testApp = await createAuthorizationTestApp({
        controllers: [BookingsController],
        providers: [
          { provide: BookingService, useValue: { quote: vi.fn() } },
        ],
      });

      app = testApp.app;

      const response = await testApp.request.get(`${API_PREFIX}/bookings/quote`);

      expect(response.status).toBe(400);
      assertErrorEnvelope(response.body as Record<string, unknown>);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('required operation keys align with scanner helper', () => {
    expect(listRequiredOperationKeys()).toEqual(REQUIRED_OPERATIONS);
  });
});
