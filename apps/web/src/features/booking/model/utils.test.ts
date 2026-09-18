import { describe, expect, it } from 'vitest';

import {
  canCancelBooking,
  canPayBooking,
  isActiveBooking,
  isHoldExpired,
} from '@/features/booking/model/utils';

describe('booking model utils', () => {
  it('allows cancellation for requested bookings', () => {
    expect(canCancelBooking('requested')).toBe(true);
    expect(canCancelBooking('completed')).toBe(false);
  });

  it('allows payment for pending_payment bookings', () => {
    expect(canPayBooking('pending_payment')).toBe(true);
    expect(canPayBooking('confirmed')).toBe(false);
  });

  it('detects active bookings', () => {
    expect(isActiveBooking('active')).toBe(true);
    expect(isActiveBooking('cancelled')).toBe(false);
  });

  it('detects expired holds', () => {
    expect(isHoldExpired('2000-01-01T00:00:00.000Z')).toBe(true);
    expect(isHoldExpired(null)).toBe(false);
    expect(isHoldExpired(new Date(Date.now() + 60_000).toISOString())).toBe(false);
  });
});
