/**
 * Admin feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for admin types within the feature.
 */

// Re-export shared types from the types package
export type {
  AdminDashboardStats,
  AdminHostListItem,
  AdminPaymentListItem,
  AdminPropertyListItem,
  AuditLogListItem,
  HousingRequestListItem,
  HousingRequestStatus,
} from '@housing-platform/types';

export type { HostBookingListItem, HostStatus } from '@housing-platform/types';
export type { PaymentStatus } from '@housing-platform/types';

// ============================================================================
// Feature-Local Types (Supabase row types)
// ============================================================================

/**
 * Row type returned by Supabase for admin booking list queries.
 * Used internally by mappers.
 */
export interface AdminBookingRow {
  id: string;
  status: string;
  booking_type: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  customer_notes: string | null;
  created_at: string;
  properties: { title: string } | { title: string }[] | null;
  rooms: { name: string } | { name: string }[] | null;
  booking_price_snapshots: { total_krw: number } | { total_krw: number }[] | null;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

/**
 * Row type returned by Supabase for admin payment queries.
 * Used internally by mappers.
 */
export interface AdminPaymentRow {
  id: string;
  order_id: string;
  booking_id: string;
  amount_krw: number;
  status: string;
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
}

/**
 * Row type returned by Supabase for admin property queries.
 * Used internally by mappers.
 */
export interface AdminPropertyRow {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  district: string;
  status: string;
  booking_mode: string;
  monthly_price_min: number | null;
  updated_at: string;
  rooms: { id: string }[] | null;
  hosts: { display_name: string } | { display_name: string }[] | null;
}

/**
 * Row type returned by Supabase for admin host queries.
 * Used internally by mappers.
 */
export interface AdminHostRow {
  id: string;
  display_name: string;
  status: string;
  verified_at: string | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}

/**
 * Row type returned by Supabase for housing request queries.
 * Used internally by mappers.
 */
export interface HousingRequestRow {
  id: string;
  email: string;
  desired_area: string;
  check_in: string | null;
  check_out: string | null;
  budget_max: number | null;
  accommodation_type: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

/**
 * Row type returned by Supabase for audit log queries.
 * Used internally by mappers.
 */
export interface AuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
}
