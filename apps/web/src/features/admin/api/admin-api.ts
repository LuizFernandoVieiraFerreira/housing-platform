import type {
  AdminDashboardStats,
  AdminHostListItem,
  AdminPaymentListItem,
  AdminPropertyListItem,
  AuditLogListItem,
  HostBookingListItem,
  HousingRequestListItem,
  HousingRequestStatus,
} from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function isAdminProfile(role: string | undefined): boolean {
  return role === 'admin';
}

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
    throw propertiesResult.error;
  }

  if (hostsResult.error) {
    throw hostsResult.error;
  }

  if (bookingsResult.error) {
    throw bookingsResult.error;
  }

  if (housingRequestsResult.error) {
    throw housingRequestsResult.error;
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
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const host = getRelation(
      row.hosts as { display_name: string } | { display_name: string }[] | null,
    );

    return {
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      propertyType: row.property_type as AdminPropertyListItem['propertyType'],
      district: String(row.district),
      status: row.status as AdminPropertyListItem['status'],
      bookingMode: row.booking_mode as AdminPropertyListItem['bookingMode'],
      monthlyPriceMin: (row.monthly_price_min as number | null) ?? null,
      roomCount: Array.isArray(row.rooms) ? row.rooms.length : 0,
      updatedAt: String(row.updated_at),
      hostDisplayName: host?.display_name ?? 'Unknown host',
    };
  });
}

export async function publishAdminProperty(propertyId: string) {
  const { data, error } = await supabase.rpc('publish_property', {
    p_property_id: propertyId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectAdminProperty(propertyId: string) {
  const { data, error } = await supabase.rpc('reject_property_review', {
    p_property_id: propertyId,
  });

  if (error) {
    throw error;
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
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = getRelation(
      row.profiles as { full_name: string } | { full_name: string }[] | null,
    );

    return {
      id: String(row.id),
      displayName: String(row.display_name),
      status: row.status as AdminHostListItem['status'],
      profileName: profile?.full_name ?? 'Unknown user',
      verifiedAt: (row.verified_at as string | null) ?? null,
      createdAt: String(row.created_at),
    };
  });
}

export async function approveAdminHost(hostId: string) {
  const { data, error } = await supabase.rpc('approve_host', {
    p_host_id: hostId,
  });

  if (error) {
    throw error;
  }

  return data;
}

type AdminBookingRow = {
  id: string;
  status: HostBookingListItem['status'];
  booking_type: HostBookingListItem['bookingType'];
  check_in: string;
  check_out: string;
  guest_count: number;
  customer_notes: string | null;
  created_at: string;
  properties: { title: string } | { title: string }[] | null;
  rooms: { name: string } | { name: string }[] | null;
  booking_price_snapshots: { total_krw: number } | { total_krw: number }[] | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

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
    throw error;
  }

  return ((data ?? []) as AdminBookingRow[])
    .map((row) => {
      const property = getRelation(row.properties);
      const room = getRelation(row.rooms);
      const snapshot = getRelation(row.booking_price_snapshots);

      if (!property || !room || !snapshot) {
        return null;
      }

      return {
        id: row.id,
        status: row.status,
        bookingType: row.booking_type,
        checkIn: row.check_in,
        checkOut: row.check_out,
        guestCount: row.guest_count,
        customerNotes: row.customer_notes,
        propertyTitle: property.title,
        roomName: room.name,
        totalKrw: snapshot.total_krw,
        createdAt: row.created_at,
      };
    })
    .filter((booking): booking is HostBookingListItem => booking !== null);
}

export async function approveAdminBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('approve_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectAdminBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('reject_booking_request', {
    p_booking_id: bookingId,
  });

  if (error) {
    throw error;
  }

  return data;
}

type AdminPaymentRow = {
  id: string;
  order_id: string;
  booking_id: string;
  amount_krw: number;
  status: AdminPaymentListItem['status'];
  confirmed_at: string | null;
  created_at: string;
  bookings:
    | {
        properties: { title: string } | { title: string }[] | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      }
    | Array<{
        properties: { title: string } | { title: string }[] | null;
        profiles: { full_name: string } | { full_name: string }[] | null;
      }>
    | null;
};

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
    throw error;
  }

  return ((data ?? []) as AdminPaymentRow[])
    .map((row) => {
      const booking = getRelation(row.bookings);
      const property = booking ? getRelation(booking.properties) : null;
      const profile = booking ? getRelation(booking.profiles) : null;

      return {
        id: row.id,
        orderId: row.order_id,
        bookingId: row.booking_id,
        amountKrw: row.amount_krw,
        status: row.status,
        propertyTitle: property?.title ?? null,
        customerName: profile?.full_name ?? null,
        confirmedAt: row.confirmed_at,
        createdAt: row.created_at,
      };
    })
    .filter((payment): payment is AdminPaymentListItem => payment !== null);
}

export async function fetchAdminHousingRequests(): Promise<HousingRequestListItem[]> {
  const { data, error } = await supabase
    .from('housing_requests')
    .select(
      'id, email, desired_area, check_in, check_out, budget_max, accommodation_type, notes, status, created_at',
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    email: String(row.email),
    desiredArea: String(row.desired_area),
    checkIn: (row.check_in as string | null) ?? null,
    checkOut: (row.check_out as string | null) ?? null,
    budgetMax: (row.budget_max as number | null) ?? null,
    accommodationType:
      (row.accommodation_type as HousingRequestListItem['accommodationType']) ?? null,
    notes: (row.notes as string | null) ?? null,
    status: row.status as HousingRequestListItem['status'],
    createdAt: String(row.created_at),
  }));
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
    throw error;
  }

  return data;
}

type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

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
    throw error;
  }

  return ((data ?? []) as AuditLogRow[]).map((row) => {
    const profile = getRelation(row.profiles);

    return {
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actorName: profile?.full_name ?? 'Unknown admin',
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    };
  });
}
