import { describe, expect, it } from 'vitest';

import {
  getRelation,
  mapAdminBookingRow,
  mapAdminHostRow,
  mapAdminPaymentRow,
  mapAdminPropertyRow,
  mapAuditLogRow,
  mapHousingRequestRow,
} from '@/features/admin/api/mappers';

describe('admin mappers', () => {
  describe('getRelation', () => {
    it('returns first item from arrays', () => {
      expect(getRelation([{ id: 'a' }, { id: 'b' }])).toEqual({ id: 'a' });
    });

    it('returns object values unchanged', () => {
      expect(getRelation({ id: 'a' })).toEqual({ id: 'a' });
    });

    it('returns null for empty relations', () => {
      expect(getRelation(null)).toBeNull();
      expect(getRelation([])).toBeNull();
    });
  });

  describe('mapAdminPropertyRow', () => {
    it('maps property and host display name', () => {
      const result = mapAdminPropertyRow({
        id: 'prop-1',
        title: 'Mapo Studio',
        slug: 'mapo-studio',
        property_type: 'studio',
        district: 'Mapo',
        status: 'published',
        booking_mode: 'instant',
        monthly_price_min: 900_000,
        updated_at: '2026-01-01T00:00:00.000Z',
        rooms: [{ id: 'room-1' }, { id: 'room-2' }],
        hosts: { display_name: 'Host One' },
      });

      expect(result).toMatchObject({
        id: 'prop-1',
        title: 'Mapo Studio',
        roomCount: 2,
        hostDisplayName: 'Host One',
      });
    });
  });

  describe('mapAdminHostRow', () => {
    it('falls back when profile relation is missing', () => {
      const result = mapAdminHostRow({
        id: 'host-1',
        display_name: 'Seoul Stays',
        status: 'pending',
        verified_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        profiles: null,
      });

      expect(result.profileName).toBe('Unknown user');
    });
  });

  describe('mapAdminBookingRow', () => {
    it('returns null when required relations are incomplete', () => {
      const result = mapAdminBookingRow({
        id: 'booking-1',
        status: 'requested',
        booking_type: 'request',
        check_in: '2026-02-01',
        check_out: '2026-03-01',
        guest_count: 1,
        customer_notes: null,
        created_at: '2026-01-01T00:00:00.000Z',
        properties: null,
        rooms: { name: 'Room A' },
        booking_price_snapshots: { total_krw: 900_000 },
      });

      expect(result).toBeNull();
    });

    it('maps complete booking rows', () => {
      const result = mapAdminBookingRow({
        id: 'booking-1',
        status: 'confirmed',
        booking_type: 'instant',
        check_in: '2026-02-01',
        check_out: '2026-03-01',
        guest_count: 2,
        customer_notes: 'Late check-in',
        created_at: '2026-01-01T00:00:00.000Z',
        properties: { title: 'Mapo Studio' },
        rooms: { name: 'Room A' },
        booking_price_snapshots: { total_krw: 900_000 },
      });

      expect(result).toMatchObject({
        id: 'booking-1',
        propertyTitle: 'Mapo Studio',
        roomName: 'Room A',
        totalKrw: 900_000,
      });
    });
  });

  describe('mapAdminPaymentRow', () => {
    it('maps nested booking relations with fallbacks', () => {
      const result = mapAdminPaymentRow({
        id: 'payment-1',
        order_id: 'order-1',
        booking_id: 'booking-1',
        amount_krw: 900_000,
        status: 'confirmed',
        confirmed_at: '2026-01-02T00:00:00.000Z',
        created_at: '2026-01-01T00:00:00.000Z',
        bookings: {
          properties: { title: 'Mapo Studio' },
          profiles: { full_name: 'Jane Doe' },
        },
      });

      expect(result).toMatchObject({
        propertyTitle: 'Mapo Studio',
        customerName: 'Jane Doe',
      });
    });
  });

  describe('mapHousingRequestRow', () => {
    it('maps housing request fields', () => {
      const result = mapHousingRequestRow({
        id: 'req-1',
        email: 'guest@example.com',
        desired_area: 'Hongdae',
        check_in: '2026-03-01',
        check_out: '2026-04-01',
        budget_max: 1_000_000,
        accommodation_type: 'studio',
        notes: 'Quiet area',
        status: 'open',
        created_at: '2026-01-01T00:00:00.000Z',
      });

      expect(result).toMatchObject({
        email: 'guest@example.com',
        desiredArea: 'Hongdae',
        budgetMax: 1_000_000,
      });
    });
  });

  describe('mapAuditLogRow', () => {
    it('uses actor profile name when available', () => {
      const result = mapAuditLogRow({
        id: 'log-1',
        action: 'publish_property',
        entity_type: 'property',
        entity_id: 'prop-1',
        metadata: { source: 'admin' },
        created_at: '2026-01-01T00:00:00.000Z',
        profiles: { full_name: 'Admin User' },
      });

      expect(result.actorName).toBe('Admin User');
    });
  });
});
