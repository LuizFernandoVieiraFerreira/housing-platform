import type { ApiErrorResponse } from '@housing-platform/types';

import { registerApiRoute } from '@/shared/api/client';
import { logger, createTimer } from '@/shared/lib/logger';
import { AppError, Result, type ErrorCode } from '@/shared/lib/result';

import type { ConfirmPaymentResult, CreatePaymentOrderResult } from '../model';
import { createDevMockPaymentKey, TOSS_FAIL_PATH, TOSS_SUCCESS_PATH } from '../model';
import {
  mapConfirmPaymentResult,
  mapCreatePaymentOrderResult,
  toConfirmPaymentBody,
  toCreatePaymentOrderBody,
} from './mappers';

const log = logger.child('payment-api');

/**
 * Extract an error message from a Supabase function invocation error.
 * Handles Response objects that may contain JSON error payloads.
 */
async function parseFunctionError(
  error: unknown,
  fallbackCode: ErrorCode,
  fallbackMessage: string,
): Promise<AppError> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;
      if (payload.error?.message) {
        return new AppError(fallbackCode, payload.error.message, { cause: error });
      }
    } catch {
      return new AppError(fallbackCode, fallbackMessage, { cause: error });
    }
  }

  const appError = AppError.from(error, fallbackCode);
  if (appError.message === 'An unexpected error occurred') {
    return new AppError(fallbackCode, fallbackMessage, { cause: error });
  }
  return appError;
}

function extractInlineError(data: unknown): string | null {
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    return (data as ApiErrorResponse).error.message;
  }
  return null;
}

const createPaymentOrderRequest = registerApiRoute<Result<CreatePaymentOrderResult>>(
  'payments',
  'POST',
  '/payments/orders',
  async ({ client, body }) => {
    const bookingId = body as string;
    const timer = createTimer();
    log.info('Creating payment order', { action: 'createPaymentOrder', data: { bookingId } });

    try {
      const { data, error } = await client.functions.invoke('create-payment', {
        body: toCreatePaymentOrderBody(bookingId),
      });

      if (error) {
        const appError = await parseFunctionError(
          error,
          'PAYMENT_FAILED',
          'Unable to start checkout.',
        );
        log.error('Payment order creation failed', {
          action: 'createPaymentOrder',
          error: appError,
          data: { bookingId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      const inlineError = extractInlineError(data);
      if (inlineError) {
        const appError = new AppError('PAYMENT_FAILED', inlineError);
        log.error('Payment order creation failed (inline error)', {
          action: 'createPaymentOrder',
          error: appError,
          data: { bookingId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      const result = mapCreatePaymentOrderResult(data);

      if (!result) {
        const appError = new AppError('PAYMENT_FAILED', 'Unable to start checkout.');
        log.error('Payment order creation returned invalid payload', {
          action: 'createPaymentOrder',
          error: appError,
          data: { bookingId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      log.info('Payment order created successfully', {
        action: 'createPaymentOrder',
        data: {
          bookingId,
          orderId: result.orderId,
          amountKrw: result.amountKrw,
          durationMs: timer(),
        },
      });
      return Result.ok(result);
    } catch (error) {
      log.error('Payment order creation threw exception', {
        action: 'createPaymentOrder',
        error,
        data: { bookingId, durationMs: timer() },
      });
      return Result.fromError(error, 'PAYMENT_FAILED');
    }
  },
);

/**
 * Create a payment order for a booking. Returns a Result.
 */
export function createPaymentOrder(bookingId: string): Promise<Result<CreatePaymentOrderResult>> {
  return createPaymentOrderRequest({ body: bookingId });
}

interface ConfirmPaymentInput {
  paymentKey: string;
  orderId: string;
  amount: number;
}

const confirmPaymentRequest = registerApiRoute<Result<ConfirmPaymentResult>>(
  'payments',
  'POST',
  '/payments/confirm',
  async ({ client, body }) => {
    const input = body as ConfirmPaymentInput;
    const timer = createTimer();
    log.info('Confirming payment', {
      action: 'confirmPayment',
      data: { orderId: input.orderId, amount: input.amount },
    });

    try {
      const { data, error } = await client.functions.invoke('confirm-payment', {
        body: toConfirmPaymentBody(input),
      });

      if (error) {
        const appError = await parseFunctionError(
          error,
          'PAYMENT_FAILED',
          'Unable to confirm payment.',
        );
        log.error('Payment confirmation failed', {
          action: 'confirmPayment',
          error: appError,
          data: { orderId: input.orderId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      const inlineError = extractInlineError(data);
      if (inlineError) {
        const appError = new AppError('PAYMENT_FAILED', inlineError);
        log.error('Payment confirmation failed (inline error)', {
          action: 'confirmPayment',
          error: appError,
          data: { orderId: input.orderId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      const result = mapConfirmPaymentResult(data);

      if (!result) {
        const appError = new AppError('PAYMENT_FAILED', 'Unable to confirm payment.');
        log.error('Payment confirmation returned invalid payload', {
          action: 'confirmPayment',
          error: appError,
          data: { orderId: input.orderId, durationMs: timer() },
        });
        return Result.err(appError);
      }

      log.info('Payment confirmed successfully', {
        action: 'confirmPayment',
        data: { orderId: input.orderId, bookingId: result.bookingId, durationMs: timer() },
      });
      return Result.ok(result);
    } catch (error) {
      log.error('Payment confirmation threw exception', {
        action: 'confirmPayment',
        error,
        data: { orderId: input.orderId, durationMs: timer() },
      });
      return Result.fromError(error, 'PAYMENT_FAILED');
    }
  },
);

/**
 * Confirm a payment after user completes the payment flow. Returns a Result.
 */
export function confirmPayment(input: ConfirmPaymentInput): Promise<Result<ConfirmPaymentResult>> {
  return confirmPaymentRequest({ body: input });
}

export function getTossClientKey(): string | null {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim();
  return clientKey || null;
}

export function getTossSuccessUrl(): string {
  return (
    import.meta.env.VITE_TOSS_SUCCESS_URL?.trim() ||
    `${import.meta.env.VITE_APP_URL ?? window.location.origin}${TOSS_SUCCESS_PATH}`
  );
}

export function getTossFailUrl(): string {
  return (
    import.meta.env.VITE_TOSS_FAIL_URL?.trim() ||
    `${import.meta.env.VITE_APP_URL ?? window.location.origin}${TOSS_FAIL_PATH}`
  );
}

export function isPaymentDevMockEnabled(): boolean {
  return !getTossClientKey();
}

export { createDevMockPaymentKey };
