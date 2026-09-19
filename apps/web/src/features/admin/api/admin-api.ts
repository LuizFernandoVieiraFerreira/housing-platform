import type {
  AdminDashboardStats,
  AdminHostListItem,
  AdminPaymentListItem,
  AdminPropertyListItem,
  AuditLogListItem,
  HostBookingListItem,
  HousingRequestListItem,
  HousingRequestStatus,
  AdminBookingRow,
  AdminHostRow,
  AdminPaymentRow,
  AdminPropertyRow,
  AuditLogRow,
  HousingRequestRow,
} from '../model';
import { isAdminProfile } from '../model';

import { registerApiRoute } from '@/shared/api/client';
import { wrapSupabaseError } from '@/shared/lib/errors';

import {
  mapAdminPropertyRow,
  mapAdminHostRow,
  mapAdminBookingRow,
  mapAdminPaymentRow,
  mapHousingRequestRow,
  mapAuditLogRow,
} from './mappers';

export { isAdminProfile };

export const fetchAdminDashboardStats = registerApiRoute<AdminDashboardStats>(
  'admin',
  'GET',
  '/admin/stats',
  async ({ client }) => {
    const [propertiesResult, hostsResult, bookingsResult, housingRequestsResult] =
      await Promise.all([
        client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review')
          .is('deleted_at', null),
        client
          .from('hosts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('deleted_at', null),
        client
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['requested', 'pending_payment', 'payment_failed']),
        client
          .from('housing_requests')
          .select('id', { count: 'exact', head: true })
          .in('status', ['new', 'in_progress']),
      ]);

    if (propertiesResult.error) {
      throw wrapSupabaseError(propertiesResult.error, 'Unable to load dashboard stats');
    }

    if (hostsResult.error) {
      throw wrapSupabaseError(hostsResult.error, 'Unable to load dashboard stats');
    }

    if (bookingsResult.error) {
      throw wrapSupabaseError(bookingsResult.error, 'Unable to load dashboard stats');
    }

    if (housingRequestsResult.error) {
      throw wrapSupabaseError(housingRequestsResult.error, 'Unable to load dashboard stats');
    }

    return {
      pendingProperties: propertiesResult.count ?? 0,
      pendingHosts: hostsResult.count ?? 0,
      openBookings: bookingsResult.count ?? 0,
      openHousingRequests: housingRequestsResult.count ?? 0,
    };
  },
);

export const fetchAdminProperties = registerApiRoute<AdminPropertyListItem[]>(
  'admin',
  'GET',
  '/admin/properties',
  async ({ client }) => {
    const { data, error } = await client
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        property_type,
        district,
        status,
        booking_mode,
        monthly_price_min,
        updated_at,
        rooms ( id ),
        hosts ( display_name )
      `,
      )
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load properties');
    }

    return ((data ?? []) as AdminPropertyRow[]).map(mapAdminPropertyRow);
  },
);

const publishAdminPropertyRequest = registerApiRoute<unknown>(
  'admin',
  'POST',
  '/admin/properties/:id/publish',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('publish_property', {
      p_property_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to publish property');
    }

    return data;
  },
);

export function publishAdminProperty(propertyId: string) {
  return publishAdminPropertyRequest({ params: { id: propertyId } });
}

const rejectAdminPropertyRequest = registerApiRoute<unknown>(
  'admin',
  'POST',
  '/admin/properties/:id/reject',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('reject_property_review', {
      p_property_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to reject property');
    }

    return data;
  },
);

export function rejectAdminProperty(propertyId: string) {
  return rejectAdminPropertyRequest({ params: { id: propertyId } });
}

export const fetchAdminHosts = registerApiRoute<AdminHostListItem[]>(
  'admin',
  'GET',
  '/admin/hosts',
  async ({ client }) => {
    const { data, error } = await client
      .from('hosts')
      .select(
        `
        id,
        display_name,
        status,
        verified_at,
        created_at,
        profiles ( full_name )
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load hosts');
    }

    return ((data ?? []) as AdminHostRow[]).map(mapAdminHostRow);
  },
);

const approveAdminHostRequest = registerApiRoute<unknown>(
  'admin',
  'POST',
  '/admin/hosts/:id/approve',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('approve_host', {
      p_host_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to approve host');
    }

    return data;
  },
);

export function approveAdminHost(hostId: string) {
  return approveAdminHostRequest({ params: { id: hostId } });
}

export const fetchAdminBookings = registerApiRoute<HostBookingListItem[]>(
  'admin',
  'GET',
  '/admin/bookings',
  async ({ client }) => {
    const { data, error } = await client
      .from('bookings')
      .select(
        `
        id,
        status,
        booking_type,
        check_in,
        check_out,
        guest_count,
        customer_notes,
        created_at,
        properties ( title ),
        rooms ( name ),
        booking_price_snapshots ( total_krw ),
        profiles!customer_id ( full_name )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load bookings');
    }

    return ((data ?? []) as AdminBookingRow[])
      .map(mapAdminBookingRow)
      .filter((booking): booking is HostBookingListItem => booking !== null);
  },
);

const approveAdminBookingRequest = registerApiRoute<unknown>(
  'admin',
  'POST',
  '/bookings/:id/approve',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('approve_booking_request', {
      p_booking_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to approve booking');
    }

    return data;
  },
);

export function approveAdminBooking(bookingId: string) {
  return approveAdminBookingRequest({ params: { id: bookingId } });
}

const rejectAdminBookingRequest = registerApiRoute<unknown>(
  'admin',
  'POST',
  '/bookings/:id/reject',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('reject_booking_request', {
      p_booking_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to reject booking');
    }

    return data;
  },
);

export function rejectAdminBooking(bookingId: string) {
  return rejectAdminBookingRequest({ params: { id: bookingId } });
}

export const fetchAdminPayments = registerApiRoute<AdminPaymentListItem[]>(
  'admin',
  'GET',
  '/admin/payments',
  async ({ client }) => {
    const { data, error } = await client
      .from('payments')
      .select(
        `
        id,
        order_id,
        booking_id,
        amount_krw,
        status,
        confirmed_at,
        created_at,
        bookings (
          properties ( title ),
          profiles!customer_id ( full_name )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load payments');
    }

    return ((data ?? []) as AdminPaymentRow[]).map(mapAdminPaymentRow);
  },
);

export const fetchAdminHousingRequests = registerApiRoute<HousingRequestListItem[]>(
  'admin',
  'GET',
  '/admin/housing-requests',
  async ({ client }) => {
    const { data, error } = await client
      .from('housing_requests')
      .select(
        'id, email, desired_area, check_in, check_out, budget_max, accommodation_type, notes, status, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load housing requests');
    }

    return ((data ?? []) as HousingRequestRow[]).map(mapHousingRequestRow);
  },
);

const updateAdminHousingRequestStatusRequest = registerApiRoute<unknown>(
  'admin',
  'PATCH',
  '/admin/housing-requests/:id',
  async ({ client, params, body }) => {
    const { status } = body as { status: HousingRequestStatus };
    const { data, error } = await client.rpc('update_housing_request_status', {
      p_request_id: params.id,
      p_status: status,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to update request status');
    }

    return data;
  },
);

export function updateAdminHousingRequestStatus(requestId: string, status: HousingRequestStatus) {
  return updateAdminHousingRequestStatusRequest({
    params: { id: requestId },
    body: { status },
  });
}

export const fetchAdminAuditLogs = registerApiRoute<AuditLogListItem[]>(
  'admin',
  'GET',
  '/admin/audit-logs',
  async ({ client }) => {
    const { data, error } = await client
      .from('audit_logs')
      .select(
        `
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles ( full_name )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load audit logs');
    }

    return ((data ?? []) as AuditLogRow[]).map(mapAuditLogRow);
  },
);
