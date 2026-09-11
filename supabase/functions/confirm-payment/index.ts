import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { captureException, logInfo } from '../_shared/logger.ts';
import { enforceRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { createServiceClient, getAuthenticatedUser } from '../_shared/supabase.ts';
import {
  confirmTossPayment,
  isPaymentDevMockEnabled,
  isSuccessfulTossPayment,
} from '../_shared/toss.ts';

interface ConfirmPaymentBody {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'confirm-payment',
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterMs);
  }

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed', 405);
  }

  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return errorResponse('UNAUTHENTICATED', 'Authentication required', 401);
    }

    let body: ConfirmPaymentBody;

    try {
      body = await req.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body');
    }

    const { paymentKey, orderId, amount } = body;

    if (!paymentKey || !orderId || amount == null) {
      return errorResponse('VALIDATION_ERROR', 'paymentKey, orderId, and amount are required');
    }

    const serviceClient = createServiceClient();

    const { data: paymentRow, error: paymentLookupError } = await serviceClient
      .from('payments')
      .select('id, customer_id, amount_krw, status')
      .eq('order_id', orderId)
      .maybeSingle();

    if (paymentLookupError || !paymentRow) {
      return errorResponse('NOT_FOUND', 'Payment not found', 404);
    }

    if (paymentRow.customer_id !== user.id) {
      return errorResponse('FORBIDDEN', 'You cannot confirm this payment', 403);
    }

    if (paymentRow.amount_krw !== amount) {
      return errorResponse('PAYMENT_AMOUNT_MISMATCH', 'Payment amount does not match booking total', 409);
    }

    if (paymentRow.status === 'confirmed') {
      logInfo('payment.confirm_idempotent', { userId: user.id, orderId });

      return jsonResponse({
        paymentId: paymentRow.id,
        orderId,
        bookingId: null,
        status: 'confirmed',
      });
    }

    let tossResponse: Record<string, unknown> | null = null;

    try {
      if (isPaymentDevMockEnabled() && paymentKey.startsWith('devmock_')) {
        tossResponse = {
          status: 'DONE',
          paymentKey,
          orderId,
          totalAmount: amount,
          method: 'DEV_MOCK',
        };
      } else {
        tossResponse = await confirmTossPayment({
          paymentKey,
          orderId,
          amount,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment confirmation failed';

      await serviceClient.rpc('mark_payment_failed', {
        p_order_id: orderId,
        p_reason: message,
        p_toss_response: tossResponse,
      });

      return errorResponse('PAYMENT_FAILED', message, 402);
    }

    if (!isSuccessfulTossPayment(tossResponse)) {
      await serviceClient.rpc('mark_payment_failed', {
        p_order_id: orderId,
        p_reason: String(tossResponse.status ?? 'Payment not completed'),
        p_toss_response: tossResponse,
      });

      return errorResponse('PAYMENT_FAILED', 'Payment was not completed', 402);
    }

    const { data: finalizedPayment, error: finalizeError } = await serviceClient.rpc(
      'finalize_successful_payment',
      {
        p_order_id: orderId,
        p_payment_key: paymentKey,
        p_amount_krw: amount,
        p_toss_response: tossResponse,
      },
    );

    if (finalizeError) {
      const message = finalizeError.message ?? 'Unable to finalize payment';

      if (message.includes('expired')) {
        return errorResponse('BOOKING_EXPIRED', message, 409);
      }

      if (message.includes('mismatch')) {
        return errorResponse('PAYMENT_AMOUNT_MISMATCH', message, 409);
      }

      return errorResponse('INTERNAL_ERROR', message, 500);
    }

    const payment = finalizedPayment as Record<string, unknown>;

    logInfo('payment.confirmed', {
      userId: user.id,
      orderId,
      paymentId: payment.id,
      bookingId: payment.booking_id,
    });

    return jsonResponse({
      paymentId: payment.id,
      orderId: payment.order_id,
      bookingId: payment.booking_id,
      status: payment.status,
    });
  } catch (error) {
    await captureException(error, { function: 'confirm-payment' });
    return errorResponse('INTERNAL_ERROR', 'Unable to confirm payment', 500);
  }
});
