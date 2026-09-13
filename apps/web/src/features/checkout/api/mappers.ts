/**
 * Data transformation functions for checkout/payment API.
 */

import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  CreatePaymentOrderResult,
} from '../model';

export function toCreatePaymentOrderBody(bookingId: string) {
  return { bookingId };
}

export function toConfirmPaymentBody(input: ConfirmPaymentInput) {
  return {
    paymentKey: input.paymentKey,
    orderId: input.orderId,
    amount: input.amount,
  };
}

export function mapCreatePaymentOrderResult(data: unknown): CreatePaymentOrderResult | null {
  if (typeof data !== 'object' || data === null || !('orderId' in data) || !('amountKrw' in data)) {
    return null;
  }

  return data as CreatePaymentOrderResult;
}

export function mapConfirmPaymentResult(data: unknown): ConfirmPaymentResult | null {
  if (typeof data !== 'object' || data === null || !('status' in data)) {
    return null;
  }

  return data as ConfirmPaymentResult;
}
