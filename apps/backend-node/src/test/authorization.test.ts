import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminController } from '../features/admin/admin.controller';
import { AdminRepository } from '../features/admin/admin.repository';
import { AdminService } from '../features/admin/admin.service';
import { BookingNotificationService } from '../features/bookings/booking-notification.service';
import { BookingPricingService } from '../features/bookings/booking-pricing.service';
import type { BookingListRow } from '../features/bookings/booking.repository';
import { BookingRepository } from '../features/bookings/booking.repository';
import { BookingService } from '../features/bookings/booking.service';
import { BookingsController } from '../features/bookings/bookings.controller';
import { NotificationRepository } from '../features/notifications/notification.repository';
import { NotificationService } from '../features/notifications/notification.service';
import { NotificationsController } from '../features/notifications/notifications.controller';
import { PaymentFinalizationService } from '../features/payments/payment-finalization.service';
import { PaymentRepository } from '../features/payments/payment.repository';
import { PaymentService } from '../features/payments/payment.service';
import { PaymentsController } from '../features/payments/payments.controller';
import { TossClient } from '../features/payments/toss.client';
import { ProfileRepository } from '../features/profile/profile.repository';
import { ProfileService } from '../features/profile/profile.service';
import { ProfileController } from '../features/profile/profile.controller';
import { PropertiesController } from '../features/properties/properties.controller';
import { PropertyRepository } from '../features/properties/property.repository';
import { PropertySearchService } from '../features/properties/property-search.service';
import { PropertyService } from '../features/properties/property.service';
import { ForbiddenError } from '../shared/errors';
import { RateLimitService } from '../shared/rate-limit/rate-limit.service';
import { StorageUrlResolver } from '../shared/storage/storage-url.resolver';
import { assertErrorEnvelope } from './support/contract';
import {
  API_PREFIX,
  type AuthorizationTestApp,
  buildBearerHeader,
  closeAuthorizationTestApp,
  createAuthorizationTestApp,
  createCustomer,
  createHost,
  hostPropertyPayload,
  stubAuthUser,
  stubNonAdmin,
} from './support/authorization-test-support';

interface AdminRouteCase {
  method: 'get' | 'post' | 'patch';
  path: string;
  body?: Record<string, unknown>;
}

function adminRoutes(): AdminRouteCase[] {
  const id = randomUUID();
  return [
    { method: 'get', path: `${API_PREFIX}/admin/stats` },
    { method: 'get', path: `${API_PREFIX}/admin/properties` },
    { method: 'post', path: `${API_PREFIX}/admin/properties/${id}/publish` },
    { method: 'post', path: `${API_PREFIX}/admin/properties/${id}/reject` },
    { method: 'post', path: `${API_PREFIX}/admin/hosts/${id}/approve` },
    { method: 'get', path: `${API_PREFIX}/admin/audit-logs` },
    {
      method: 'patch',
      path: `${API_PREFIX}/admin/housing-requests/${id}`,
      body: { status: 'closed' },
    },
  ];
}

function bookingListRow(customerId = randomUUID()): BookingListRow {
  return {
    id: randomUUID(),
    customerId,
    status: 'requested',
    bookingType: 'request',
    checkIn: new Date('2026-10-01T00:00:00.000Z'),
    checkOut: new Date('2026-11-01T00:00:00.000Z'),
    guestCount: 1,
    holdExpiresAt: null,
    createdAt: new Date(),
    customerNotes: null,
    propertyId: randomUUID(),
    roomId: randomUUID(),
    propertyTitle: 'Test Property',
    district: 'Mapo-gu',
    roomName: 'Room A',
    rentKrw: 930_000,
    serviceFeeKrw: 93_000,
    totalKrw: 1_023_000,
    pricingVersion: 'v1',
  };
}

function propertyRow(status: 'draft' | 'published' | 'pending_review' = 'draft') {
  return {
    id: randomUUID(),
    host_id: randomUUID(),
    title: 'Test Property',
    slug: 'test-property',
    description: 'A valid property description for testing.',
    property_type: 'studio',
    address_line1: '123 Test Street',
    city: 'Seoul',
    country: 'KR',
    district: 'Mapo-gu',
    status,
    booking_mode: 'request',
    min_stay_nights: 30,
    monthly_price_min: status === 'published' ? 930_000 : null,
    is_featured: false,
    tags: [],
    embedding_sync_attempts: 0,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };
}

function profileRow(profileId: string, role: 'customer' | 'host' | 'admin' = 'customer') {
  return {
    id: profileId,
    role,
    full_name: 'Jane Doe',
    phone: null,
    avatar_url: null,
    preferred_language: 'en',
    marketing_consent: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };
}

const noopRateLimit = {
  assertRateLimit: vi.fn().mockResolvedValue(undefined),
};

describe('authorization', () => {
  describe('anonymous access', () => {
    let testApp: AuthorizationTestApp;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    it.each(adminRoutes())(
      '$method $path requires authentication',
      async ({ method, path, body }) => {
        testApp = await createAuthorizationTestApp({
          controllers: [AdminController],
          providers: [
            AdminService,
            { provide: AdminRepository, useValue: {} },
          ],
        });

        const http = testApp.request[method](path);
        const response = await (body ? http.send(body) : http);

        expect(response.status).toBe(401);
        assertErrorEnvelope(response.body as Record<string, unknown>);
        expect(response.body.error.code).toBe('UNAUTHENTICATED');
      },
    );
  });

  describe('property visibility', () => {
    let testApp: AuthorizationTestApp;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    it('draft property is not found on public route', async () => {
      const propertyId = randomUUID();
      const propertyRepository = {
        getPublishedProperty: vi.fn().mockResolvedValue(null),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          PropertyService,
          { provide: PropertyRepository, useValue: propertyRepository },
          {
            provide: PropertySearchService,
            useValue: { search: vi.fn() },
          },
          {
            provide: StorageUrlResolver,
            useValue: { resolvePropertyImageUrl: vi.fn() },
          },
        ],
      });

      const response = await testApp.request.get(
        `${API_PREFIX}/properties/${propertyId}`,
      );

      expect(response.status).toBe(404);
      assertErrorEnvelope(response.body as Record<string, unknown>);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('search delegates to repository without auth', async () => {
      const propertySearchService = {
        search: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          { provide: PropertyService, useValue: {} },
          { provide: PropertySearchService, useValue: propertySearchService },
        ],
      });

      const response = await testApp.request.get(`${API_PREFIX}/properties`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: [], totalCount: 0 });
      expect(propertySearchService.search).toHaveBeenCalledOnce();
    });
  });

  describe('non-host property mutations', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    it('customer cannot update property', async () => {
      const propertyId = randomUUID();
      const propertyRepository = {
        getHostProperty: vi.fn().mockResolvedValue(propertyRow('draft')),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          PropertyService,
          { provide: PropertyRepository, useValue: propertyRepository },
          {
            provide: PropertySearchService,
            useValue: { search: vi.fn() },
          },
          {
            provide: StorageUrlResolver,
            useValue: { resolvePropertyImageUrl: vi.fn() },
          },
        ],
      });

      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);

      const response = await testApp.request
        .patch(`${API_PREFIX}/properties/${propertyId}`)
        .set('Authorization', await buildBearerHeader(customer))
        .send(hostPropertyPayload());

      expect(response.status).toBe(403);
      assertErrorEnvelope(response.body as Record<string, unknown>);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('customer cannot set property location', async () => {
      const propertyId = randomUUID();
      const propertyRepository = {
        getHostProperty: vi.fn().mockResolvedValue(propertyRow('draft')),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          PropertyService,
          { provide: PropertyRepository, useValue: propertyRepository },
          {
            provide: PropertySearchService,
            useValue: { search: vi.fn() },
          },
          {
            provide: StorageUrlResolver,
            useValue: { resolvePropertyImageUrl: vi.fn() },
          },
        ],
      });

      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);

      const response = await testApp.request
        .post(`${API_PREFIX}/properties/${propertyId}/location`)
        .set('Authorization', await buildBearerHeader(customer))
        .send({ latitude: 37.55, longitude: 126.92 });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('customer cannot submit property for review', async () => {
      const propertyId = randomUUID();

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          PropertyService,
          { provide: PropertyRepository, useValue: {} },
          {
            provide: PropertySearchService,
            useValue: { search: vi.fn() },
          },
          {
            provide: StorageUrlResolver,
            useValue: { resolvePropertyImageUrl: vi.fn() },
          },
        ],
      });

      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);

      const response = await testApp.request
        .post(`${API_PREFIX}/properties/${propertyId}/submit-review`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('host property mutations', () => {
    let testApp: AuthorizationTestApp;
    let host: ReturnType<typeof createHost>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      host = createHost();
    });

    it('host cannot update published property', async () => {
      const propertyId = randomUUID();
      const propertyRepository = {
        getHostProperty: vi.fn().mockResolvedValue(propertyRow('published')),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PropertiesController],
        providers: [
          PropertyService,
          { provide: PropertyRepository, useValue: propertyRepository },
          {
            provide: PropertySearchService,
            useValue: { search: vi.fn() },
          },
          {
            provide: StorageUrlResolver,
            useValue: { resolvePropertyImageUrl: vi.fn() },
          },
        ],
      });

      stubAuthUser(testApp.prisma, host);
      testApp.prisma.properties.count.mockResolvedValue(1);

      const response = await testApp.request
        .patch(`${API_PREFIX}/properties/${propertyId}`)
        .set('Authorization', await buildBearerHeader(host))
        .send(hostPropertyPayload());

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('booking authorization', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    function createBookingTestApp(
      bookingRepository: Record<string, ReturnType<typeof vi.fn>>,
    ) {
      return createAuthorizationTestApp({
        controllers: [BookingsController],
        providers: [
          BookingService,
          { provide: BookingRepository, useValue: bookingRepository },
          { provide: BookingPricingService, useValue: {} },
          { provide: BookingNotificationService, useValue: {} },
          { provide: RateLimitService, useValue: noopRateLimit },
        ],
      });
    }

    it('customer cannot view another customers booking', async () => {
      const bookingId = randomUUID();
      const bookingRepository = {
        getBookingDetailRow: vi
          .fn()
          .mockResolvedValue(bookingListRow(randomUUID())),
      };

      testApp = await createBookingTestApp(bookingRepository);
      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);

      const response = await testApp.request
        .get(`${API_PREFIX}/bookings/${bookingId}`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('customer cannot cancel another customers booking', async () => {
      const bookingId = randomUUID();
      const bookingRepository = {
        getBooking: vi.fn().mockResolvedValue({
          id: bookingId,
          customer_id: randomUUID(),
          status: 'requested',
        }),
      };

      testApp = await createBookingTestApp(bookingRepository);
      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/bookings/${bookingId}/cancel`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('customer cannot cancel confirmed booking', async () => {
      const bookingId = randomUUID();
      const bookingRepository = {
        getBooking: vi.fn().mockResolvedValue({
          id: bookingId,
          customer_id: customer.id,
          status: 'confirmed',
        }),
        cancelBooking: vi.fn().mockResolvedValue(null),
      };

      testApp = await createBookingTestApp(bookingRepository);
      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/bookings/${bookingId}/cancel`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('customer cannot approve booking', async () => {
      const bookingId = randomUUID();
      const bookingRepository = {
        getBooking: vi.fn().mockResolvedValue({
          id: bookingId,
          property_id: randomUUID(),
        }),
      };

      testApp = await createBookingTestApp(bookingRepository);
      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);
      testApp.prisma.bookings.findUnique.mockResolvedValue({
        property_id: randomUUID(),
      });
      testApp.prisma.properties.count.mockResolvedValue(0);

      const response = await testApp.request
        .post(`${API_PREFIX}/bookings/${bookingId}/approve`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('payment authorization', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    it('customer cannot create payment order for foreign booking', async () => {
      const paymentRepository = {
        createPaymentOrder: vi
          .fn()
          .mockRejectedValue(new ForbiddenError('Booking not found')),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PaymentsController],
        providers: [
          PaymentService,
          { provide: PaymentRepository, useValue: paymentRepository },
          { provide: RateLimitService, useValue: noopRateLimit },
          { provide: TossClient, useValue: {} },
          { provide: PaymentFinalizationService, useValue: {} },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/payments/orders`)
        .set('Authorization', await buildBearerHeader(customer))
        .send({ bookingId: randomUUID() });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('customer cannot confirm foreign payment', async () => {
      const orderId = randomUUID();
      const paymentRepository = {
        getPaymentByOrderId: vi.fn().mockResolvedValue({
          id: randomUUID(),
          orderId,
          bookingId: randomUUID(),
          customerId: randomUUID(),
          amountKrw: 1_023_000,
          status: 'pending',
        }),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PaymentsController],
        providers: [
          PaymentService,
          { provide: PaymentRepository, useValue: paymentRepository },
          { provide: RateLimitService, useValue: noopRateLimit },
          { provide: TossClient, useValue: {} },
          { provide: PaymentFinalizationService, useValue: {} },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/payments/confirm`)
        .set('Authorization', await buildBearerHeader(customer))
        .send({
          paymentKey: 'pay_key',
          orderId,
          amount: 1_023_000,
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('confirm payment is not found for unknown order', async () => {
      const orderId = randomUUID();
      const paymentRepository = {
        getPaymentByOrderId: vi.fn().mockResolvedValue(null),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [PaymentsController],
        providers: [
          PaymentService,
          { provide: PaymentRepository, useValue: paymentRepository },
          { provide: RateLimitService, useValue: noopRateLimit },
          { provide: TossClient, useValue: {} },
          { provide: PaymentFinalizationService, useValue: {} },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/payments/confirm`)
        .set('Authorization', await buildBearerHeader(customer))
        .send({
          paymentKey: 'pay_key',
          orderId,
          amount: 1_023_000,
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('admin authorization', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    it.each(adminRoutes())(
      'non-admin is forbidden for $method $path',
      async ({ method, path, body }) => {
        testApp = await createAuthorizationTestApp({
          controllers: [AdminController],
          providers: [
            AdminService,
            { provide: AdminRepository, useValue: {} },
          ],
        });

        stubAuthUser(testApp.prisma, customer);
        stubNonAdmin(testApp.prisma);

        const http = testApp.request[method](path).set(
          'Authorization',
          await buildBearerHeader(customer),
        );
        const response = await (body ? http.send(body) : http);

        expect(response.status).toBe(403);
        assertErrorEnvelope(response.body as Record<string, unknown>);
        expect(response.body.error.code).toBe('FORBIDDEN');
      },
    );

    it('admin service rejects customer before repository', async () => {
      const adminRepository = {
        getDashboardStats: vi.fn(),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [AdminController],
        providers: [
          AdminService,
          { provide: AdminRepository, useValue: adminRepository },
        ],
      });

      stubAuthUser(testApp.prisma, customer);
      stubNonAdmin(testApp.prisma);

      const response = await testApp.request
        .get(`${API_PREFIX}/admin/stats`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(adminRepository.getDashboardStats).not.toHaveBeenCalled();
    });
  });

  describe('notification authorization', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    it('customer cannot mark another users notification read', async () => {
      const notificationId = randomUUID();
      const notificationRepository = {
        markRead: vi.fn().mockResolvedValue(null),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [NotificationsController],
        providers: [
          NotificationService,
          { provide: NotificationRepository, useValue: notificationRepository },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/notifications/${notificationId}/read`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('mark read scopes to authenticated user', async () => {
      const notificationId = randomUUID();
      const notification = {
        id: notificationId,
        user_id: customer.id,
        type: 'booking_request',
        title: 'New booking request',
        body: 'A guest requested a booking.',
        metadata: {},
        read_at: null,
        created_at: new Date(),
      };
      const notificationRepository = {
        markRead: vi.fn().mockResolvedValue(notification),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [NotificationsController],
        providers: [
          NotificationService,
          { provide: NotificationRepository, useValue: notificationRepository },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .post(`${API_PREFIX}/notifications/${notificationId}/read`)
        .set('Authorization', await buildBearerHeader(customer));

      expect(response.status).toBe(200);
      expect(notificationRepository.markRead).toHaveBeenCalledWith(
        customer.id,
        notificationId,
      );
    });
  });

  describe('profile authorization', () => {
    let testApp: AuthorizationTestApp;
    let customer: ReturnType<typeof createCustomer>;

    afterEach(async () => {
      if (testApp) {
        await closeAuthorizationTestApp(testApp);
      }
    });

    beforeEach(() => {
      customer = createCustomer();
    });

    it('update profile keeps existing role', async () => {
      const profileRepository = {
        update: vi.fn().mockResolvedValue(profileRow(customer.id, 'customer')),
      };

      testApp = await createAuthorizationTestApp({
        controllers: [ProfileController],
        providers: [
          ProfileService,
          { provide: ProfileRepository, useValue: profileRepository },
        ],
      });

      stubAuthUser(testApp.prisma, customer);

      const response = await testApp.request
        .patch(`${API_PREFIX}/profile`)
        .set('Authorization', await buildBearerHeader(customer))
        .send({
          fullName: 'Jane Smith',
          preferredLanguage: 'en',
          marketingConsent: true,
          role: 'admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('customer');
      expect(profileRepository.update).toHaveBeenCalledOnce();
    });
  });
});
