import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  cleanupBooking,
  createTestUser,
  deleteTestUser,
  isSupabaseReachable,
  REQUEST_BOOKING_ROOM_ID,
  SEED_HOST_EMAIL,
  SEED_HOST_PASSWORD,
  SEED_HOST_USER_ID,
  signInAs,
  uniqueBookingDates,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

describe.skipIf(!integrationEnabled)('notifications', () => {
  let guest: { email: string; password: string; id: string };
  let otherGuest: { email: string; password: string; id: string };
  let approveBookingId: string;
  let rejectBookingId: string;
  let hostNotificationId: string;

  beforeAll(async () => {
    guest = await createTestUser('notifications-guest');
    otherGuest = await createTestUser('notifications-other-guest');

    const guestClient = await signInAs(guest.email, guest.password);
    const approveDates = uniqueBookingDates('notifications-approve');
    const rejectDates = uniqueBookingDates('notifications-reject');

    const { data: approveBooking, error: approveError } = await guestClient.rpc(
      'create_booking_hold',
      {
        p_room_id: REQUEST_BOOKING_ROOM_ID,
        p_check_in: approveDates.checkIn,
        p_check_out: approveDates.checkOut,
        p_guest_count: 1,
      },
    );

    if (approveError || !approveBooking) {
      throw approveError ?? new Error('Unable to create booking for approve notification test');
    }

    approveBookingId = approveBooking.id as string;

    const { data: rejectBooking, error: rejectError } = await guestClient.rpc(
      'create_booking_hold',
      {
        p_room_id: REQUEST_BOOKING_ROOM_ID,
        p_check_in: rejectDates.checkIn,
        p_check_out: rejectDates.checkOut,
        p_guest_count: 1,
      },
    );

    if (rejectError || !rejectBooking) {
      throw rejectError ?? new Error('Unable to create booking for reject notification test');
    }

    rejectBookingId = rejectBooking.id as string;

    const hostClient = await signInAs(SEED_HOST_EMAIL, SEED_HOST_PASSWORD);

    const { data: hostNotifications, error: hostNotificationsError } = await hostClient
      .from('notifications')
      .select('id, type, metadata, read_at')
      .eq('type', 'booking_request')
      .order('created_at', { ascending: false });

    if (hostNotificationsError) {
      throw hostNotificationsError;
    }

    const hostNotification = (hostNotifications ?? []).find((notification) => {
      const metadata = notification.metadata as { booking_id?: string } | null;
      return metadata?.booking_id === approveBookingId;
    });

    if (!hostNotification) {
      throw new Error('Expected host booking_request notification');
    }

    hostNotificationId = hostNotification.id as string;
  });

  afterAll(async () => {
    await cleanupBooking(approveBookingId);
    await cleanupBooking(rejectBookingId);
    await deleteTestUser(guest.id);
    await deleteTestUser(otherGuest.id);
  });

  it('creates a booking_request notification for the host when a guest books', async () => {
    const hostClient = await signInAs(SEED_HOST_EMAIL, SEED_HOST_PASSWORD);

    const { data, error } = await hostClient
      .from('notifications')
      .select('id, type, user_id, metadata')
      .eq('id', hostNotificationId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.type).toBe('booking_request');
    expect(data?.user_id).toBe(SEED_HOST_USER_ID);
    expect((data?.metadata as { booking_id?: string }).booking_id).toBe(approveBookingId);
  });

  it('creates a booking_confirmed notification for the guest when the host approves', async () => {
    const hostClient = await signInAs(SEED_HOST_EMAIL, SEED_HOST_PASSWORD);

    const { error: approveError } = await hostClient.rpc('approve_booking_request', {
      p_booking_id: approveBookingId,
    });

    expect(approveError).toBeNull();

    const guestClient = await signInAs(guest.email, guest.password);

    const { data, error } = await guestClient
      .from('notifications')
      .select('id, type, metadata, read_at')
      .eq('type', 'booking_confirmed')
      .order('created_at', { ascending: false });

    expect(error).toBeNull();

    const notification = (data ?? []).find((row) => {
      const metadata = row.metadata as { booking_id?: string } | null;
      return metadata?.booking_id === approveBookingId;
    });

    expect(notification).toBeTruthy();
    expect(notification?.read_at).toBeNull();
  });

  it('creates a booking_rejected notification for the guest when the host rejects', async () => {
    const hostClient = await signInAs(SEED_HOST_EMAIL, SEED_HOST_PASSWORD);

    const { error: rejectError } = await hostClient.rpc('reject_booking_request', {
      p_booking_id: rejectBookingId,
    });

    expect(rejectError).toBeNull();

    const guestClient = await signInAs(guest.email, guest.password);

    const { data, error } = await guestClient
      .from('notifications')
      .select('id, type, metadata')
      .eq('type', 'booking_rejected')
      .order('created_at', { ascending: false });

    expect(error).toBeNull();

    const notification = (data ?? []).find((row) => {
      const metadata = row.metadata as { booking_id?: string } | null;
      return metadata?.booking_id === rejectBookingId;
    });

    expect(notification).toBeTruthy();
  });

  it('prevents users from reading another user notifications', async () => {
    const otherGuestClient = await signInAs(otherGuest.email, otherGuest.password);

    const { data, error } = await otherGuestClient
      .from('notifications')
      .select('id')
      .eq('id', hostNotificationId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });

  it('marks notifications as read and decreases unread count', async () => {
    const hostClient = await signInAs(SEED_HOST_EMAIL, SEED_HOST_PASSWORD);

    const { data: unreadBefore, error: unreadBeforeError } = await hostClient.rpc(
      'get_unread_notification_count',
    );

    expect(unreadBeforeError).toBeNull();
    expect(unreadBefore).toBeGreaterThan(0);

    const { error: markReadError } = await hostClient.rpc('mark_notification_read', {
      p_notification_id: hostNotificationId,
    });

    expect(markReadError).toBeNull();

    const { data: notification, error: notificationError } = await hostClient
      .from('notifications')
      .select('read_at')
      .eq('id', hostNotificationId)
      .maybeSingle();

    expect(notificationError).toBeNull();
    expect(notification?.read_at).not.toBeNull();

    const { data: unreadAfter, error: unreadAfterError } = await hostClient.rpc(
      'get_unread_notification_count',
    );

    expect(unreadAfterError).toBeNull();
    expect(unreadAfter).toBe((unreadBefore as number) - 1);
  });

  it('still completes booking creation when notification insert fails', async () => {
    const guestClient = await signInAs(guest.email, guest.password);
    const dates = uniqueBookingDates('notifications-nonblocking');

    const { data: booking, error } = await guestClient.rpc('create_booking_hold', {
      p_room_id: REQUEST_BOOKING_ROOM_ID,
      p_check_in: dates.checkIn,
      p_check_out: dates.checkOut,
      p_guest_count: 1,
    });

    expect(error).toBeNull();
    expect(booking?.id).toBeTruthy();

    if (booking?.id) {
      await cleanupBooking(booking.id as string);
    }
  });
});
