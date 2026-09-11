import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import {
  fetchTossPayment,
  getTossSecretKey,
  isFailedTossPayment,
  isPaymentDevMockEnabled,
  isSuccessfulTossPayment,
} from '../_shared/toss.ts';

interface TossWebhookPayload {
  eventType?: string;
  createdAt?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  const optionsResponse = handleOptions(req);

  if (optionsResponse) {
    return optionsResponse;
  }

  if (req.method !== 'POST') {
    return errorResponse('VALIDATION_ERROR', 'Method not allowed', 405);
  }

  if (isPaymentDevMockEnabled() && !getTossSecretKey()) {
    return jsonResponse({ ok: true, skipped: true });
  }

  let payload: TossWebhookPayload;

  try {
    payload = await req.json();
  } catch {
    return errorResponse('VALIDATION_ERROR', 'Invalid JSON body');
  }

  const paymentKey = String(payload.data?.paymentKey ?? '');
  const orderId = String(payload.data?.orderId ?? '');

  if (!paymentKey || !orderId) {
    return errorResponse('VALIDATION_ERROR', 'Webhook payload missing paymentKey or orderId');
  }

  const eventId = `${payload.eventType ?? 'UNKNOWN'}:${paymentKey}:${payload.createdAt ?? 'unknown'}`;
  const serviceClient = createServiceClient();

  const { data: paymentRow, error: paymentLookupError } = await serviceClient
    .from('payments')
    .select('id, booking_id, amount_krw, status')
    .eq('order_id', orderId)
    .maybeSingle();

  if (paymentLookupError || !paymentRow) {
    return errorResponse('NOT_FOUND', 'Payment not found', 404);
  }

  await serviceClient.rpc('record_payment_event', {
    p_event_id: eventId,
    p_payment_id: paymentRow.id,
    p_booking_id: paymentRow.booking_id,
    p_event_type: payload.eventType ?? 'UNKNOWN',
    p_payload: payload,
  });

  if (paymentRow.status === 'confirmed') {
    return jsonResponse({ ok: true, status: 'already_confirmed' });
  }

  let tossPayment: Record<string, unknown>;

  try {
    tossPayment = await fetchTossPayment(paymentKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify Toss payment';

    return errorResponse('EXTERNAL_SERVICE_ERROR', message, 502);
  }

  if (isSuccessfulTossPayment(tossPayment)) {
    const amount = Number(tossPayment.totalAmount ?? paymentRow.amount_krw);

    const { error: finalizeError } = await serviceClient.rpc('finalize_successful_payment', {
      p_order_id: orderId,
      p_payment_key: paymentKey,
      p_amount_krw: amount,
      p_toss_response: tossPayment,
    });

    if (finalizeError) {
      return errorResponse(
        'INTERNAL_ERROR',
        finalizeError.message ?? 'Unable to finalize payment',
        500,
      );
    }

    return jsonResponse({ ok: true, status: 'confirmed' });
  }

  if (isFailedTossPayment(tossPayment)) {
    await serviceClient.rpc('mark_payment_failed', {
      p_order_id: orderId,
      p_reason: String(tossPayment.status ?? 'Payment failed'),
      p_toss_response: tossPayment,
    });

    return jsonResponse({ ok: true, status: 'failed' });
  }

  return jsonResponse({ ok: true, status: 'ignored' });
});
