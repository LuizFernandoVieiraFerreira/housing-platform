import { AppError } from '@/shared/lib/errors';

import { registerSupabaseRoute } from '../supabase-adapter';
import { extractInlineFunctionError, parseEdgeFunctionError } from './helpers';

export const PAYMENT_ROUTES = [
  { method: 'POST' as const, path: '/payments/orders' },
  { method: 'POST' as const, path: '/payments/confirm' },
];

export function registerPaymentRoutes(): void {
  registerSupabaseRoute('POST', '/payments/orders', async ({ client, body }) => {
    const input = body as { bookingId?: string };

    const { data, error } = await client.functions.invoke('create-payment', {
      body: { bookingId: input.bookingId },
    });

    if (error) {
      throw await parseEdgeFunctionError(error, 'PAYMENT_FAILED', 'Unable to start checkout.');
    }

    const inlineError = extractInlineFunctionError(data);
    if (inlineError) {
      throw new AppError('PAYMENT_FAILED', inlineError);
    }

    return data;
  });

  registerSupabaseRoute('POST', '/payments/confirm', async ({ client, body }) => {
    const input = body as {
      paymentKey?: string;
      orderId?: string;
      amount?: number;
    };

    const { data, error } = await client.functions.invoke('confirm-payment', {
      body: {
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      },
    });

    if (error) {
      throw await parseEdgeFunctionError(error, 'PAYMENT_FAILED', 'Unable to confirm payment.');
    }

    const inlineError = extractInlineFunctionError(data);
    if (inlineError) {
      throw new AppError('PAYMENT_FAILED', inlineError);
    }

    return data;
  });
}
