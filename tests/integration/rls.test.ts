import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createAnonClient,
  createTestUser,
  cleanupBooking,
  deleteTestUser,
  DRAFT_PROPERTY_ID,
  HONGDAE_ROOM_ID,
  isSupabaseReachable,
  signInAs,
  uniqueBookingDates,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

describe.skipIf(!integrationEnabled)('RLS policies', () => {
  let customerA: { email: string; password: string; id: string };
  let customerB: { email: string; password: string; id: string };
  let bookingId: string;

  beforeAll(async () => {
    customerA = await createTestUser('customer-a');
    customerB = await createTestUser('customer-b');

    const clientA = await signInAs(customerA.email, customerA.password);
    const dates = uniqueBookingDates('rls-policies');

    const { data: booking, error } = await clientA.rpc('create_booking_hold', {
      p_room_id: HONGDAE_ROOM_ID,
      p_check_in: dates.checkIn,
      p_check_out: dates.checkOut,
      p_guest_count: 1,
    });

    if (error || !booking) {
      throw error ?? new Error('Unable to create booking for RLS test');
    }

    bookingId = booking.id as string;
  });

  it('prevents customers from reading another customer booking', async () => {
    const clientB = await signInAs(customerB.email, customerB.password);

    const { data, error } = await clientB
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('allows customers to read their own booking', async () => {
    const clientA = await signInAs(customerA.email, customerA.password);

    const { data, error } = await clientA
      .from('bookings')
      .select('id, customer_id')
      .eq('id', bookingId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.customer_id).toBe(customerA.id);
  });

  it('hides draft properties from anonymous users', async () => {
    const anon = createAnonClient();

    const { data, error } = await anon
      .from('properties')
      .select('id')
      .eq('id', DRAFT_PROPERTY_ID)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('blocks non-admin users from reading audit logs', async () => {
    const clientA = await signInAs(customerA.email, customerA.password);

    const { data, error } = await clientA.from('audit_logs').select('id').limit(1);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it('blocks customers from reading payment events', async () => {
    const clientA = await signInAs(customerA.email, customerA.password);

    const { data, error } = await clientA.from('payment_events').select('id').limit(1);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it('allows admins to read audit logs', async () => {
    const admin = await signInAs('admin@gmail.com', '1234qwer');

    const { error } = await admin.from('audit_logs').select('id').limit(1);

    expect(error).toBeNull();
  });

  it('blocks customers from publishing properties', async () => {
    const clientA = await signInAs(customerA.email, customerA.password);

    const { error } = await clientA.rpc('publish_property', {
      p_property_id: DRAFT_PROPERTY_ID,
    });

    expect(error?.message ?? '').toContain('Only admins can publish properties');
  });

  afterAll(async () => {
    if (bookingId) {
      await cleanupBooking(bookingId);
    }

    await deleteTestUser(customerA.id);
    await deleteTestUser(customerB.id);
  });
});
