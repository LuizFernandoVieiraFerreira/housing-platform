import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { captureException, logInfo } from '../_shared/logger.ts';
import { enforceRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';
import { createUserClient, getAuthenticatedUser } from '../_shared/supabase.ts';

interface CreatePaymentBody {
  bookingId?: string;
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  const rateLimit = enforceRateLimit(req, {
    bucket: 'create-payment',
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

    let body: CreatePaymentBody;

    try {
      body = await req.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body');
    }

    if (!body.bookingId) {
      return errorResponse('VALIDATION_ERROR', 'bookingId is required');
    }

    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return errorResponse('UNAUTHENTICATED', 'Authentication required', 401);
    }

    const supabase = createUserClient(authHeader);
    const { data, error } = await supabase.rpc('create_payment_order', {
      p_booking_id: body.bookingId,
    });

    if (error) {
      const message = error.message ?? 'Unable to create payment order';

      if (message.includes('expired')) {
        return errorResponse('BOOKING_EXPIRED', message, 409);
      }

      if (message.includes('not awaiting payment') || message.includes('not found')) {
        return errorResponse('FORBIDDEN', message, 403);
      }

      return errorResponse('INTERNAL_ERROR', message, 500);
    }

    const row = (data as Array<Record<string, unknown>> | null)?.[0];

    if (!row) {
      return errorResponse('INTERNAL_ERROR', 'Payment order was not created', 500);
    }

    logInfo('payment.order_created', {
      userId: user.id,
      bookingId: row.booking_id,
      orderId: row.order_id,
    });

    return jsonResponse({
      paymentId: row.payment_id,
      orderId: row.order_id,
      bookingId: row.booking_id,
      amountKrw: row.amount_krw,
      orderName: row.order_name,
    });
  } catch (error) {
    await captureException(error, { function: 'create-payment' });
    return errorResponse('INTERNAL_ERROR', 'Unable to create payment order', 500);
  }
});
