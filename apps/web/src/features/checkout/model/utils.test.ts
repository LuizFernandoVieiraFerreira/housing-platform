import { describe, expect, it } from 'vitest';

import {
  createDevMockPaymentKey,
  isDevMockPaymentKey,
  isPaymentSuccessful,
  isValidPaymentAmount,
} from '@/features/checkout/model/utils';

describe('checkout model utils', () => {
  it('detects successful payments', () => {
    expect(isPaymentSuccessful('confirmed')).toBe(true);
    expect(isPaymentSuccessful('failed')).toBe(false);
  });

  it('creates and detects dev mock payment keys', () => {
    const key = createDevMockPaymentKey('order-1');
    expect(isDevMockPaymentKey(key)).toBe(true);
  });

  it('validates payment amount bounds', () => {
    expect(isValidPaymentAmount(1000)).toBe(true);
    expect(isValidPaymentAmount(50)).toBe(false);
  });
});
