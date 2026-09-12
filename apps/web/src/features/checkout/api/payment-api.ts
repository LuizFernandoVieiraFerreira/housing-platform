import type {
  ApiErrorResponse,
  ConfirmPaymentResult,
  CreatePaymentOrderResult,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { AppError, Result, unwrap, type ErrorCode } from '@/shared/lib/result';

// ============================================================================
// Error Parsing Helpers
// ============================================================================

/**
 * Extract an error message from a Supabase function invocation error.
 * Handles Response objects that may contain JSON error payloads.
 */
async function parseFunctionError(
  error: unknown,
  fallbackCode: ErrorCode,
  fallbackMessage: string,
): Promise<AppError> {
  // Handle Response context (Supabase edge function errors)
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
      // JSON parsing failed, use fallback message
      return new AppError(fallbackCode, fallbackMessage, { cause: error });
    }
  }

  // Use fallback message if error doesn't have a useful message
  const appError = AppError.from(error, fallbackCode);
  if (appError.message === 'An unexpected error occurred') {
    return new AppError(fallbackCode, fallbackMessage, { cause: error });
  }
  return appError;
}

/**
 * Check if data contains an inline API error response.
 */
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

// ============================================================================
// Result-Returning API Functions
// ============================================================================

/**
 * Create a payment order for a booking. Returns a Result.
 *
 * @example
 * const result = await createPaymentOrderSafe(bookingId);
 * if (result.ok) {
 *   console.log('Order created:', result.data.orderId);
 * } else {
 *   console.error('Failed:', result.error.message);
 * }
 */
export async function createPaymentOrderSafe(
  bookingId: string,
): Promise<Result<CreatePaymentOrderResult>> {
  try {
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { bookingId },
    });

    if (error) {
      const appError = await parseFunctionError(error, 'PAYMENT_FAILED', 'Unable to start checkout.');
      return Result.err(appError);
    }

    const inlineError = extractInlineError(data);
    if (inlineError) {
      return Result.err(new AppError('PAYMENT_FAILED', inlineError));
    }

    return Result.ok(data as CreatePaymentOrderResult);
  } catch (error) {
    return Result.fromError(error, 'PAYMENT_FAILED');
  }
}

/**
 * Confirm a payment after user completes the payment flow. Returns a Result.
 *
 * @example
 * const result = await confirmPaymentSafe({ paymentKey, orderId, amount });
 * if (result.ok) {
 *   console.log('Payment confirmed for booking:', result.data.bookingId);
 * } else {
 *   console.error('Confirmation failed:', result.error.message);
 * }
 */
export async function confirmPaymentSafe(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<Result<ConfirmPaymentResult>> {
  try {
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: input,
    });

    if (error) {
      const appError = await parseFunctionError(error, 'PAYMENT_FAILED', 'Unable to confirm payment.');
      return Result.err(appError);
    }

    const inlineError = extractInlineError(data);
    if (inlineError) {
      return Result.err(new AppError('PAYMENT_FAILED', inlineError));
    }

    return Result.ok(data as ConfirmPaymentResult);
  } catch (error) {
    return Result.fromError(error, 'PAYMENT_FAILED');
  }
}

// ============================================================================
// Throwing API Functions (for TanStack Query compatibility)
// ============================================================================

/**
 * Create a payment order for a booking.
 * Throws on error (for use with TanStack Query mutations).
 *
 * @deprecated Prefer createPaymentOrderSafe for explicit error handling.
 */
export async function createPaymentOrder(bookingId: string): Promise<CreatePaymentOrderResult> {
  const result = await createPaymentOrderSafe(bookingId);
  return unwrap(result);
}

/**
 * Confirm a payment after user completes the payment flow.
 * Throws on error (for use with TanStack Query mutations).
 *
 * @deprecated Prefer confirmPaymentSafe for explicit error handling.
 */
export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmPaymentResult> {
  const result = await confirmPaymentSafe(input);
  return unwrap(result);
}

export function getTossClientKey(): string | null {
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim();
  return clientKey || null;
}

export function getTossSuccessUrl(): string {
  return (
    import.meta.env.VITE_TOSS_SUCCESS_URL?.trim() ||
    `${import.meta.env.VITE_APP_URL ?? window.location.origin}/payment/success`
  );
}

export function getTossFailUrl(): string {
  return (
    import.meta.env.VITE_TOSS_FAIL_URL?.trim() ||
    `${import.meta.env.VITE_APP_URL ?? window.location.origin}/payment/fail`
  );
}

export function isPaymentDevMockEnabled(): boolean {
  return !getTossClientKey();
}

export function createDevMockPaymentKey(orderId: string): string {
  return `devmock_${orderId}`;
}
