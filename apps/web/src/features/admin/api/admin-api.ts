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

import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

import {
  mapAdminPropertyRow,
  mapAdminHostRow,
  mapAdminBookingRow,
  mapAdminPaymentRow,
  mapHousingRequestRow,
  mapAuditLogRow,
} from './mappers';

// Re-export isAdminProfile for backward compatibility
export { isAdminProfile };

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [propertiesResult, hostsResult, bookingsResult, housingRequestsResult] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review')
      .is('deleted_at', null),
    supabase
      .from('hosts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['requested', 'pending_payment', 'payment_failed']),
    supabase
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
}

export async function fetchAdminProperties(): Promise<AdminPropertyListItem[]> {
  const { data, error } = await supabase
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
}

export async function publishAdminProperty(propertyId: string) {
  const { data, error } = await supabase.rpc('publish_property', {
    p_property_id: propertyId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to publish property');
  }

  return data;
}

export async function rejectAdminProperty(propertyId: string) {
  const { data, error } = await supabase.rpc('reject_property_review', {
    p_property_id: propertyId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to reject property');
  }

  return data;
}

export async function fetchAdminHosts(): Promise<AdminHostListItem[]> {
  const { data, error } = await supabase
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
}

export async function approveAdminHost(hostId: string) {
  const { data, error } = await supabase.rpc('approve_host', {
    p_host_id: hostId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to approve host');
  }

  return data;
}

export async function fetchAdminBookings(): Promise<HostBookingListItem[]> {
  const { data, error } = await supabase
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
        profiles:customer_id ( full_name )
      `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load bookings');
  }

  return ((data ?? []) as AdminBookingRow[])
    .map(mapAdminBookingRow)
    .filter((booking): booking is HostBookingListItem => booking !== null);
}

export async function approveAdminBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('approve_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to approve booking');
  }

  return data;
}

export async function rejectAdminBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('reject_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to reject booking');
  }

  return data;
}

export async function fetchAdminPayments(): Promise<AdminPaymentListItem[]> {
  const { data, error } = await supabase
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
          profiles:customer_id ( full_name )
        )
      `,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load payments');
  }

  return ((data ?? []) as AdminPaymentRow[]).map(mapAdminPaymentRow);
}

export async function fetchAdminHousingRequests(): Promise<HousingRequestListItem[]> {
  const { data, error } = await supabase
    .from('housing_requests')
    .select(
      'id, email, desired_area, check_in, check_out, budget_max, accommodation_type, notes, status, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load housing requests');
  }

  return ((data ?? []) as HousingRequestRow[]).map(mapHousingRequestRow);
}

export async function updateAdminHousingRequestStatus(
  requestId: string,
  status: HousingRequestStatus,
) {
  const { data, error } = await supabase.rpc('update_housing_request_status', {
    p_request_id: requestId,
    p_status: status,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to update request status');
  }

  return data;
}

export async function fetchAdminAuditLogs(): Promise<AuditLogListItem[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select(
      `
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles:actor_id ( full_name )
      `,
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load audit logs');
  }

  return ((data ?? []) as AuditLogRow[]).map(mapAuditLogRow);
}
