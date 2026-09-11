const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

export function getTossSecretKey(): string {
  return Deno.env.get('TOSS_SECRET_KEY') ?? '';
}

export function isPaymentDevMockEnabled(): boolean {
  return Deno.env.get('PAYMENT_DEV_MOCK') === 'true' || getTossSecretKey().length === 0;
}

function getAuthHeader(): string {
  const secretKey = getTossSecretKey();

  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY is not configured');
  }

  return `Basic ${btoa(`${secretKey}:`)}`;
}

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<Record<string, unknown>> {
  const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'Toss payment confirmation failed');
  }

  return payload as Record<string, unknown>;
}

export async function fetchTossPayment(paymentKey: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}`, {
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? 'Unable to fetch Toss payment');
  }

  return payload as Record<string, unknown>;
}

export function isSuccessfulTossPayment(payload: Record<string, unknown>): boolean {
  return payload.status === 'DONE';
}

export function isFailedTossPayment(payload: Record<string, unknown>): boolean {
  return (
    payload.status === 'ABORTED' || payload.status === 'CANCELED' || payload.status === 'EXPIRED'
  );
}
