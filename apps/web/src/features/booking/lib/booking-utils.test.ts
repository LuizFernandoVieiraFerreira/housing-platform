import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  canCancelBooking,
  canPayBooking,
  getBookingErrorMessage,
  isHoldExpired,
} from '@/features/booking/lib/booking-utils';

describe('canCancelBooking', () => {
  it('allows cancellation for requested and pending_payment statuses', () => {
    expect(canCancelBooking('requested')).toBe(true);
    expect(canCancelBooking('pending_payment')).toBe(true);
  });

  it('blocks cancellation for other statuses', () => {
    expect(canCancelBooking('confirmed')).toBe(false);
    expect(canCancelBooking('cancelled')).toBe(false);
    expect(canCancelBooking('payment_failed')).toBe(false);
  });
});

describe('canPayBooking', () => {
  it('allows payment for pending_payment and payment_failed statuses', () => {
    expect(canPayBooking('pending_payment')).toBe(true);
    expect(canPayBooking('payment_failed')).toBe(true);
  });

  it('blocks payment for other statuses', () => {
    expect(canPayBooking('requested')).toBe(false);
    expect(canPayBooking('confirmed')).toBe(false);
  });
});

describe('isHoldExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false when hold expiry is null', () => {
    expect(isHoldExpired(null)).toBe(false);
  });

  it('returns true when hold expiry is in the past', () => {
    expect(isHoldExpired('2026-06-15T11:59:59.000Z')).toBe(true);
  });

  it('returns false when hold expiry is in the future', () => {
    expect(isHoldExpired('2026-06-15T12:00:01.000Z')).toBe(false);
  });
});

describe('getBookingErrorMessage', () => {
  it('maps conflict errors to datesUnavailable i18n message', () => {
    expect(getBookingErrorMessage(new Error('booking conflict detected'), 'fallback')).toMatch(
      /dates|unavailable|not available/i,
    );
  });

  it('returns Error message for non-conflict errors', () => {
    expect(getBookingErrorMessage(new Error('Network failed'), 'fallback')).toBe('Network failed');
  });

  it('returns message from error-like objects', () => {
    expect(getBookingErrorMessage({ message: 'RPC failed' }, 'fallback')).toBe('RPC failed');
  });

  it('returns fallback for unknown error shapes', () => {
    expect(getBookingErrorMessage(null, 'Something went wrong')).toBe('Something went wrong');
  });
});
