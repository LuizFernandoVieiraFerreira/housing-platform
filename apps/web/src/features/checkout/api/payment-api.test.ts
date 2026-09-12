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

      await expect(createPaymentOrder('booking-1')).resolves.toEqual({
        orderId: 'order-123',
        amountKrw: 500_000,
        orderName: 'Monthly stay',
      });

      expect(invokeMock).toHaveBeenCalledWith('create-payment', {
        body: { bookingId: 'booking-1' },
      });
    });

    it('throws inline API error messages from response body', async () => {
      invokeMock.mockResolvedValue({
        data: { error: { message: 'Booking is not payable.' } },
        error: null,
      });

      await expect(createPaymentOrder('booking-1')).rejects.toThrow('Booking is not payable.');
    });

    it('throws parsed function error from Response context', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: {
          context: new Response(JSON.stringify({ error: { message: 'Hold expired.' } }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }),
        },
      });

      await expect(createPaymentOrder('booking-1')).rejects.toThrow('Hold expired.');
    });

    it('falls back to default message when function error is opaque', async () => {
      invokeMock.mockResolvedValue({
        data: null,
        error: new Error('network down'),
      });

      await expect(createPaymentOrder('booking-1')).rejects.toThrow('network down');
    });
  });

  describe('confirmPayment', () => {
    it('returns confirmation result on success', async () => {
      invokeMock.mockResolvedValue({
        data: { bookingId: 'booking-99', status: 'confirmed' },
        error: null,
      });

      await expect(
        confirmPayment({
          paymentKey: 'pay-key',
          orderId: 'order-99',
          amount: 500_000,
        }),
      ).resolves.toEqual({
        bookingId: 'booking-99',
        status: 'confirmed',
      });
    });

    it('throws inline API error messages from response body', async () => {
      invokeMock.mockResolvedValue({
        data: { error: { message: 'Amount mismatch.' } },
        error: null,
      });

      await expect(
        confirmPayment({
          paymentKey: 'pay-key',
          orderId: 'order-99',
          amount: 500_000,
        }),
      ).rejects.toThrow('Amount mismatch.');
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
