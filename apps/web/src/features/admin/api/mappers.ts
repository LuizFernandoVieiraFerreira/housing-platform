/**
 * Data transformation functions for admin API responses.
 *
 * Mappers convert between:
 * - API/Supabase row format (snake_case)
 * - Domain model format (camelCase)
 *
 * This centralizes all data transformation logic for easier testing
 * and maintenance.
 */

import type {
  AdminHostListItem,
  AdminPaymentListItem,
  AdminPropertyListItem,
  AuditLogListItem,
  HostBookingListItem,
  HousingRequestListItem,
  AdminBookingRow,
  AdminHostRow,
  AdminPaymentRow,
  AdminPropertyRow,
  AuditLogRow,
  HousingRequestRow,
} from '../model';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract single item from Supabase relation (handles array vs object).
 */
export function getRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

// ============================================================================
// Response → Domain Mappers
// ============================================================================

/**
 * Map property row to admin property list item.
 */
export function mapAdminPropertyRow(row: AdminPropertyRow): AdminPropertyListItem {
  const host = getRelation(row.hosts);

  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    propertyType: row.property_type as AdminPropertyListItem['propertyType'],
    district: String(row.district),
    status: row.status as AdminPropertyListItem['status'],
    bookingMode: row.booking_mode as AdminPropertyListItem['bookingMode'],
    monthlyPriceMin: row.monthly_price_min ?? null,
    roomCount: Array.isArray(row.rooms) ? row.rooms.length : 0,
    updatedAt: String(row.updated_at),
    hostDisplayName: host?.display_name ?? 'Unknown host',
  };
}

/**
 * Map host row to admin host list item.
 */
export function mapAdminHostRow(row: AdminHostRow): AdminHostListItem {
  const profile = getRelation(row.profiles);

  return {
    id: String(row.id),
    displayName: String(row.display_name),
    status: row.status as AdminHostListItem['status'],
    profileName: profile?.full_name ?? 'Unknown user',
    verifiedAt: row.verified_at ?? null,
    createdAt: String(row.created_at),
  };
}

/**
 * Map booking row to host booking list item.
 * Returns null if required relations are missing.
 */
export function mapAdminBookingRow(row: AdminBookingRow): HostBookingListItem | null {
  const property = getRelation(row.properties);
  const room = getRelation(row.rooms);
  const snapshot = getRelation(row.booking_price_snapshots);

  if (!property || !room || !snapshot) {
    return null;
  }

  return {
    id: row.id,
    status: row.status as HostBookingListItem['status'],
    bookingType: row.booking_type as HostBookingListItem['bookingType'],
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestCount: row.guest_count,
    customerNotes: row.customer_notes,
    propertyTitle: property.title,
    roomName: room.name,
    totalKrw: snapshot.total_krw,
    createdAt: row.created_at,
  };
}

/**
 * Map payment row to admin payment list item.
 */
export function mapAdminPaymentRow(row: AdminPaymentRow): AdminPaymentListItem {
  const booking = getRelation(row.bookings);
  const property = booking ? getRelation(booking.properties) : null;
  const profile = booking ? getRelation(booking.profiles) : null;

  return {
    id: row.id,
    orderId: row.order_id,
    bookingId: row.booking_id,
    amountKrw: row.amount_krw,
    status: row.status as AdminPaymentListItem['status'],
    propertyTitle: property?.title ?? null,
    customerName: profile?.full_name ?? null,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

/**
 * Map housing request row to housing request list item.
 */
export function mapHousingRequestRow(row: HousingRequestRow): HousingRequestListItem {
  return {
    id: String(row.id),
    email: String(row.email),
    desiredArea: String(row.desired_area),
    checkIn: row.check_in ?? null,
    checkOut: row.check_out ?? null,
    budgetMax: row.budget_max ?? null,
    accommodationType:
      (row.accommodation_type as HousingRequestListItem['accommodationType']) ?? null,
    notes: row.notes ?? null,
    status: row.status as HousingRequestListItem['status'],
    createdAt: String(row.created_at),
  };
}

/**
 * Map audit log row to audit log list item.
 */
export function mapAuditLogRow(row: AuditLogRow): AuditLogListItem {
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
}
