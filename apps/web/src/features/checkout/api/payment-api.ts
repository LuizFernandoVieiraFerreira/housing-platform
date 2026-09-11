import type {
  ApiErrorResponse,
  ConfirmPaymentResult,
  CreatePaymentOrderResult,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

function parseFunctionError(error: unknown, fallback: string): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    typeof error.context === 'object' &&
    error.context !== null &&
    'json' in error.context &&
    typeof (error.context as { json?: () => Promise<unknown> }).json === 'function'
  ) {
    return new Error(fallback);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}

async function readFunctionError(error: unknown, fallback: string): Promise<Error> {
  if (
    typeof error === 'object' &&
    error !== null &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const payload = (await error.context.json()) as ApiErrorResponse;

      if (payload.error?.message) {
        return new Error(payload.error.message);
      }
    } catch {
      return parseFunctionError(error, fallback);
    }
  }

  return parseFunctionError(error, fallback);
}

export async function createPaymentOrder(bookingId: string): Promise<CreatePaymentOrderResult> {
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { bookingId },
  });

  if (error) {
    throw await readFunctionError(error, 'Unable to start checkout.');
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    throw new Error((data as ApiErrorResponse).error.message);
  }

  return data as CreatePaymentOrderResult;
}

export async function confirmPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmPaymentResult> {
  const { data, error } = await supabase.functions.invoke('confirm-payment', {
    body: input,
  });

  if (error) {
    throw await readFunctionError(error, 'Unable to confirm payment.');
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ApiErrorResponse).error?.message === 'string'
  ) {
    throw new Error((data as ApiErrorResponse).error.message);
  }

  return data as ConfirmPaymentResult;
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
