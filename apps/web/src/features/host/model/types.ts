/**
 * Host feature types.
 *
 * Re-exports shared types and defines feature-local types.
 * This is the single source of truth for host types within the feature.
 */

// Re-export shared types from the types package
export type {
  HostRecord,
  HostStatus,
  HostPropertyListItem,
  HostPropertyDetail,
  HostRoomDetail,
  HostBookingListItem,
} from '@housing-platform/types';

// Re-export property-related types used in host context
export type {
  AccommodationType,
  BookingMode,
  PropertyStatus,
  RoomStatus,
  AmenityOption,
} from '@housing-platform/types';

// Re-export input types from validation package
export type {
  HostRegisterInput,
  HostPropertyInput,
  HostRoomInput,
} from '@housing-platform/validation';

// ============================================================================
// Feature-Local Types
// ============================================================================

/**
 * Row type returned by Supabase for host property list queries.
 * Used internally by mappers.
 */
export interface HostPropertyListRow {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  district: string;
  status: string;
  booking_mode: string;
  monthly_price_min: number | null;
  rooms: Array<{ id: string }> | null;
  updated_at: string;
}

/**
 * Row type returned by Supabase for host property detail queries.
 * Used internally by mappers.
 */
export interface HostPropertyDetailRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  property_type: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  district: string;
  nearest_station_name: string | null;
  nearest_station_walk_min: number | null;
  status: string;
  booking_mode: string;
  min_stay_nights: number;
  tags: string[];
  location: unknown;
  property_amenities?: Array<{ amenity_id: string }>;
  rooms?: HostRoomRow[];
}

/**
 * Row type for room data from Supabase.
 */
export interface HostRoomRow {
  id: string;
  name: string;
  room_type: string | null;
  size_sqm: number | null;
  max_occupancy: number;
  monthly_price_krw: number;
  status: string;
  available_from: string | null;
}

/**
 * Row type returned by Supabase for host booking list queries.
 */
export interface HostBookingRow {
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
}

/**
 * Coordinates row returned by RPC function.
 */
export interface CoordinatesRow {
  latitude: number;
  longitude: number;
}
