import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@/shared/api/supabase', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { unwrap } from '@/shared/lib/result';

import {
  confirmPayment,
  createDevMockPaymentKey,
  createPaymentOrder,
  isPaymentDevMockEnabled,
} from '@/features/checkout/api/payment-api';

describe('payment-api', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  describe('createPaymentOrder', () => {
    it('returns order data on success', async () => {
      invokeMock.mockResolvedValue({
        data: {
          orderId: 'order-123',
          amountKrw: 500_000,
          orderName: 'Monthly stay',
        },
        error: null,
      });

      const order = unwrap(await createPaymentOrder('booking-1'));

      expect(order).toEqual({
        orderId: 'order-123',
        amountKrw: 500_000,
        orderName: 'Monthly stay',
      });

      expect(invokeMock).toHaveBeenCalledWith('create-payment', {
        body: { bookingId: 'booking-1' },
      });
    });

    it('returns an error result for inline API error messages', async () => {
      invokeMock.mockResolvedValue({
        data: { error: { message: 'Booking is not payable.' } },
        error: null,
      });

      const result = await createPaymentOrder('booking-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Booking is not payable.');
      }
    });

    it('returns an error result for function errors with Response context', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: {
          context: new Response(JSON.stringify({ error: { message: 'Hold expired.' } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
        },
      });

      const result = await createPaymentOrder('booking-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Hold expired.');
      }
    });

    it('returns an error result for opaque function errors', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: new Error('network down'),
      });

      const result = await createPaymentOrder('booking-1');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('network down');
      }
    });
  });

  describe('confirmPayment', () => {
    it('returns confirmation result on success', async () => {
      invokeMock.mockResolvedValue({
        data: { bookingId: 'booking-99', status: 'confirmed' },
        error: null,
      });

      const result = unwrap(
        await confirmPayment({
          paymentKey: 'pay-key',
          orderId: 'order-99',
          amount: 500_000,
        }),
      );

      expect(result).toEqual({
        bookingId: 'booking-99',
        status: 'confirmed',
      });
    });

    it('returns an error result for inline API error messages', async () => {
      invokeMock.mockResolvedValue({
        data: { error: { message: 'Amount mismatch.' } },
        error: null,
      });

      const result = await confirmPayment({
        paymentKey: 'pay-key',
        orderId: 'order-99',
        amount: 500_000,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe('Amount mismatch.');
      }
    });
  });

  describe('dev mock helpers', () => {
    it('enables dev mock when Toss client key is missing', () => {
      vi.stubEnv('VITE_TOSS_CLIENT_KEY', '');
      expect(isPaymentDevMockEnabled()).toBe(true);
      vi.unstubAllEnvs();
    });

    it('disables dev mock when Toss client key is configured', () => {
      vi.stubEnv('VITE_TOSS_CLIENT_KEY', 'test-client-key');
      expect(isPaymentDevMockEnabled()).toBe(false);
      vi.unstubAllEnvs();
    });

    it('builds deterministic dev mock payment keys', () => {
      expect(createDevMockPaymentKey('order-abc')).toBe('devmock_order-abc');
    });
  });
});
