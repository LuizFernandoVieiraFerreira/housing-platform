import { describe, expect, it } from 'vitest';

import { REGISTERED_SUPABASE_ROUTES } from './index';

const EXPECTED_ROUTES = [
  { method: 'GET', path: '/properties' },
  { method: 'GET', path: '/properties/featured' },
  { method: 'GET', path: '/properties/:id' },
  { method: 'POST', path: '/properties' },
  { method: 'PATCH', path: '/properties/:id' },
  { method: 'POST', path: '/properties/:id/submit-review' },
  { method: 'POST', path: '/properties/:id/location' },
  { method: 'POST', path: '/properties/:id/rooms' },
  { method: 'DELETE', path: '/rooms/:roomId' },
  { method: 'GET', path: '/amenities' },
  { method: 'GET', path: '/bookings/quote' },
  { method: 'GET', path: '/bookings' },
  { method: 'POST', path: '/bookings' },
  { method: 'GET', path: '/bookings/:id' },
  { method: 'POST', path: '/bookings/:id/cancel' },
  { method: 'POST', path: '/bookings/:id/approve' },
  { method: 'POST', path: '/bookings/:id/reject' },
  { method: 'POST', path: '/payments/orders' },
  { method: 'POST', path: '/payments/confirm' },
  { method: 'POST', path: '/hosts' },
  { method: 'GET', path: '/hosts/me' },
  { method: 'GET', path: '/hosts/me/properties' },
  { method: 'GET', path: '/hosts/me/properties/:id' },
  { method: 'GET', path: '/hosts/me/bookings' },
  { method: 'GET', path: '/admin/stats' },
  { method: 'GET', path: '/admin/properties' },
  { method: 'POST', path: '/admin/properties/:id/publish' },
  { method: 'POST', path: '/admin/properties/:id/reject' },
  { method: 'GET', path: '/admin/hosts' },
  { method: 'POST', path: '/admin/hosts/:id/approve' },
  { method: 'GET', path: '/admin/bookings' },
  { method: 'GET', path: '/admin/payments' },
  { method: 'GET', path: '/admin/housing-requests' },
  { method: 'PATCH', path: '/admin/housing-requests/:id' },
  { method: 'GET', path: '/admin/audit-logs' },
  { method: 'GET', path: '/notifications' },
  { method: 'GET', path: '/notifications/unread-count' },
  { method: 'POST', path: '/notifications/:id/read' },
  { method: 'POST', path: '/notifications/read-all' },
  { method: 'GET', path: '/profile' },
  { method: 'PATCH', path: '/profile' },
  { method: 'POST', path: '/search/ai' },
  { method: 'GET', path: '/support/channel-boot' },
] as const;

describe('supabase route registration', () => {
  it('registers all expected routes', () => {
    for (const route of EXPECTED_ROUTES) {
      expect(REGISTERED_SUPABASE_ROUTES).toContainEqual(route);
    }

    expect(REGISTERED_SUPABASE_ROUTES).toHaveLength(EXPECTED_ROUTES.length);
  });
});
