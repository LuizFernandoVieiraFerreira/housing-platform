import { describe, expect, it } from 'vitest';

import { accountKeys } from '@/features/account';
import { searchKeys } from '@/features/search';
import { bookingKeys } from '@/features/booking';
import { checkoutKeys } from '@/features/checkout';
import { listingsKeys } from '@/features/listings';
import { hostKeys } from '@/features/host';
import { adminKeys } from '@/features/admin';
import { notificationKeys } from '@/features/notifications';

describe('colocated query keys', () => {
  describe('accountKeys', () => {
    it('scopes profile cache entries by user id', () => {
      expect(accountKeys.profile.current('user-a')).toEqual([
        'account',
        'profile',
        'current',
        'user-a',
      ]);
      expect(accountKeys.profile.current('user-b')).toEqual([
        'account',
        'profile',
        'current',
        'user-b',
      ]);
    });
  });

  describe('searchKeys', () => {
    it('builds stable property search keys from filters', () => {
      const filters = { query: 'Hongdae', guests: 2 };
      expect(searchKeys.search(filters)).toEqual(['properties', 'search', filters]);
    });

    it('builds property detail keys', () => {
      expect(searchKeys.detail('prop-123')).toEqual(['properties', 'detail', 'prop-123']);
    });

    it('builds AI search keys from request payload', () => {
      const request = { query: 'near subway', guests: 2 };
      expect(searchKeys.aiSearch(request)).toEqual(['properties', 'ai-search', request]);
    });

    it('builds featured property key', () => {
      expect(searchKeys.featured()).toEqual(['properties', 'featured']);
    });
  });

  describe('bookingKeys', () => {
    it('builds mine query key', () => {
      expect(bookingKeys.mine()).toEqual(['bookings', 'mine']);
    });

    it('builds detail query key', () => {
      expect(bookingKeys.detail('booking-456')).toEqual(['bookings', 'detail', 'booking-456']);
    });

    it('builds quote query key from input', () => {
      const input = { roomId: 'room-1', checkIn: '2026-01-01' };
      expect(bookingKeys.quote(input)).toEqual(['bookings', 'quote', input]);
    });
  });

  describe('checkoutKeys', () => {
    it('builds payment key scoped to booking id', () => {
      expect(checkoutKeys.payment('booking-789')).toEqual(['checkout', 'payment', 'booking-789']);
    });
  });

  describe('listingsKeys', () => {
    it('builds featured listings key', () => {
      expect(listingsKeys.featured()).toEqual(['listings', 'featured']);
    });
  });

  describe('hostKeys', () => {
    it('builds current host key', () => {
      expect(hostKeys.current()).toEqual(['host', 'current']);
    });

    it('builds properties key hierarchy', () => {
      expect(hostKeys.properties.all()).toEqual(['host', 'properties']);
      expect(hostKeys.properties.detail('prop-789')).toEqual(['host', 'properties', 'prop-789']);
    });
  });

  describe('adminKeys', () => {
    it('builds dashboard key', () => {
      expect(adminKeys.dashboard()).toEqual(['admin', 'dashboard']);
    });

    it('builds all admin section keys', () => {
      expect(adminKeys.properties()).toEqual(['admin', 'properties']);
      expect(adminKeys.hosts()).toEqual(['admin', 'hosts']);
      expect(adminKeys.bookings()).toEqual(['admin', 'bookings']);
    });
  });

  describe('notificationKeys', () => {
    it('scopes notification lists by user id', () => {
      expect(notificationKeys.list('user-x')).toEqual(['notifications', 'list', 'user-x']);
      expect(notificationKeys.unreadCount('user-x')).toEqual([
        'notifications',
        'unread-count',
        'user-x',
      ]);
    });
  });
});
