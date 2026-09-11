import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createTestUser,
  cleanupBooking,
  deleteTestUser,
  getAnonKey,
  getFunctionsUrl,
  HONGDAE_ROOM_ID,
  isSupabaseReachable,
  signInAs,
  uniqueBookingDates,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

async function isFunctionsReachable(): Promise<boolean> {
  if (!integrationEnabled) {
    return false;
  }

  try {
    const response = await fetch(`${getFunctionsUrl()}/channel-boot`, {
      method: 'GET',
      headers: {
        apikey: getAnonKey(),
      },
    });

    return response.status !== 404;
  } catch {
    return false;
  }
}

const functionsEnabled = await isFunctionsReachable();

describe.skipIf(!integrationEnabled || !functionsEnabled)('Payment confirmation', () => {
  let customer: { email: string; password: string; id: string };
  let accessToken = '';
  let orderId = '';
  let amountKrw = 0;
  let paymentKey = '';
  let bookingId = '';

  beforeAll(async () => {
    customer = await createTestUser('payment-customer');
    const client = await signInAs(customer.email, customer.password);
    const session = await client.auth.getSession();

    accessToken = session.data.session?.access_token ?? '';

    if (!accessToken) {
      throw new Error('Missing access token for payment integration test');
    }

    const dates = uniqueBookingDates('payment-confirmation');
    const { data: booking, error: bookingError } = await client.rpc('create_booking_hold', {
      p_room_id: HONGDAE_ROOM_ID,
      p_check_in: dates.checkIn,
      p_check_out: dates.checkOut,
      p_guest_count: 1,
    });

    if (bookingError || !booking) {
      throw bookingError ?? new Error('Unable to create booking hold');
    }

    bookingId = booking.id as string;

    const { data: paymentOrder, error: paymentOrderError } = await client.rpc('create_payment_order', {
      p_booking_id: booking.id,
    });

    if (paymentOrderError || !paymentOrder?.[0]) {
      throw paymentOrderError ?? new Error('Unable to create payment order');
    }

    orderId = paymentOrder[0].order_id as string;
    amountKrw = paymentOrder[0].amount_krw as number;
    paymentKey = `devmock_${orderId}`;
  });

  async function confirmPayment() {
    const response = await fetch(`${getFunctionsUrl()}/confirm-payment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: getAnonKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: amountKrw,
      }),
    });

    const payload = (await response.json()) as {
      status?: string;
      paymentId?: string;
      error?: { message?: string };
    };

    return { response, payload };
  }

  it('confirms a dev-mock payment and is idempotent on retry', async () => {
    const first = await confirmPayment();

    expect(first.response.status).toBe(200);
    expect(first.payload.status).toBe('confirmed');

    const second = await confirmPayment();

    expect(second.response.status).toBe(200);
    expect(second.payload.status).toBe('confirmed');
    expect(second.payload.paymentId).toBe(first.payload.paymentId);
  });

  afterAll(async () => {
    if (bookingId) {
      await cleanupBooking(bookingId);
    }

    await deleteTestUser(customer.id);
  });
});
