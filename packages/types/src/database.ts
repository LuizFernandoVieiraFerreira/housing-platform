import type { HousingRequestStatus } from './admin';
import type { Profile, UserRole } from './auth';
import type { Booking, BookingPriceSnapshot, BookingStatus, BookingType } from './bookings';
import type { Host, HostStatus } from './host';
import type { NotificationType } from './notifications';
import type { Payment, PaymentStatus } from './payments';
import type {
  AccommodationType,
  Amenity,
  BookingMode,
  LocationAlias,
  Property,
  PropertyImage,
  PropertySearchEmbedding,
  PropertyStatus,
  Room,
  RoomStatus,
} from './properties';

/** Row shape for the notifications table. */
export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/** Row shape for the housing_requests table. */
export interface HousingRequestRow {
  id: string;
  customer_id: string | null;
  email: string;
  desired_area: string;
  check_in: string | null;
  check_out: string | null;
  budget_max: number | null;
  accommodation_type: AccommodationType | null;
  notes: string | null;
  status: HousingRequestStatus;
  created_at: string;
  updated_at: string;
}

/** Row shape for the audit_logs table. */
export interface AuditLogRow {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Row shape for the property_amenities join table. */
export interface PropertyAmenityRow {
  property_id: string;
  amenity_id: string;
}

/** Supabase table relationship metadata (empty for tables without FK metadata). */
export type DatabaseRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Ensures domain row types satisfy Supabase `GenericTable['Row']`. */
type TableRow<T> = T & Record<string, unknown>;

/** Preserves literal `referencedRelation` while keeping mutable string arrays for Supabase embed typing. */
type TypedRelationship<ReferencedRelation extends string> = DatabaseRelationship & {
  referencedRelation: ReferencedRelation;
};

function defineRelationship<ReferencedRelation extends string>(
  relationship: TypedRelationship<ReferencedRelation>,
): TypedRelationship<ReferencedRelation> {
  return relationship;
}

/** Foreign-key metadata for Supabase embedded selects. */
export const dbRelationships = {
  hostsProfile: defineRelationship({
    foreignKeyName: 'hosts_profile_id_fkey',
    columns: ['profile_id'],
    referencedRelation: 'profiles',
    referencedColumns: ['id'],
  }),
  propertiesHost: defineRelationship({
    foreignKeyName: 'properties_host_id_fkey',
    columns: ['host_id'],
    referencedRelation: 'hosts',
    referencedColumns: ['id'],
  }),
  roomsProperty: defineRelationship({
    foreignKeyName: 'rooms_property_id_fkey',
    columns: ['property_id'],
    referencedRelation: 'properties',
    referencedColumns: ['id'],
  }),
  propertyImagesProperty: defineRelationship({
    foreignKeyName: 'property_images_property_id_fkey',
    columns: ['property_id'],
    referencedRelation: 'properties',
    referencedColumns: ['id'],
  }),
  propertyAmenitiesProperty: defineRelationship({
    foreignKeyName: 'property_amenities_property_id_fkey',
    columns: ['property_id'],
    referencedRelation: 'properties',
    referencedColumns: ['id'],
  }),
  propertyAmenitiesAmenity: defineRelationship({
    foreignKeyName: 'property_amenities_amenity_id_fkey',
    columns: ['amenity_id'],
    referencedRelation: 'amenities',
    referencedColumns: ['id'],
  }),
  bookingsCustomer: defineRelationship({
    foreignKeyName: 'bookings_customer_id_fkey',
    columns: ['customer_id'],
    referencedRelation: 'profiles',
    referencedColumns: ['id'],
  }),
  bookingsRoom: defineRelationship({
    foreignKeyName: 'bookings_room_id_fkey',
    columns: ['room_id'],
    referencedRelation: 'rooms',
    referencedColumns: ['id'],
  }),
  bookingsProperty: defineRelationship({
    foreignKeyName: 'bookings_property_id_fkey',
    columns: ['property_id'],
    referencedRelation: 'properties',
    referencedColumns: ['id'],
  }),
  bookingSnapshotsBooking: defineRelationship({
    foreignKeyName: 'booking_price_snapshots_booking_id_fkey',
    columns: ['booking_id'],
    isOneToOne: true,
    referencedRelation: 'bookings',
    referencedColumns: ['id'],
  }),
  paymentsBooking: defineRelationship({
    foreignKeyName: 'payments_booking_id_fkey',
    columns: ['booking_id'],
    referencedRelation: 'bookings',
    referencedColumns: ['id'],
  }),
  paymentsCustomer: defineRelationship({
    foreignKeyName: 'payments_customer_id_fkey',
    columns: ['customer_id'],
    referencedRelation: 'profiles',
    referencedColumns: ['id'],
  }),
  auditLogsActor: defineRelationship({
    foreignKeyName: 'audit_logs_actor_id_fkey',
    columns: ['actor_id'],
    referencedRelation: 'profiles',
    referencedColumns: ['id'],
  }),
  notificationsUser: defineRelationship({
    foreignKeyName: 'notifications_user_id_fkey',
    columns: ['user_id'],
    referencedRelation: 'profiles',
    referencedColumns: ['id'],
  }),
};

type DbRelationships = typeof dbRelationships;

type PublicTables = {
  profiles: {
    Row: TableRow<Profile>;
    Insert: {
      id: string;
      role?: UserRole;
      full_name: string;
      phone?: string | null;
      avatar_url?: string | null;
      preferred_language?: string;
      marketing_consent?: boolean;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      role?: UserRole;
      full_name?: string;
      phone?: string | null;
      avatar_url?: string | null;
      preferred_language?: string;
      marketing_consent?: boolean;
      deleted_at?: string | null;
      updated_at?: string;
    };
    Relationships: [];
  };
  hosts: {
    Row: TableRow<Host>;
    Insert: {
      id?: string;
      profile_id: string;
      display_name: string;
      status?: HostStatus;
      verified_at?: string | null;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      profile_id?: string;
      display_name?: string;
      status?: HostStatus;
      verified_at?: string | null;
      deleted_at?: string | null;
      updated_at?: string;
    };
    Relationships: [DbRelationships['hostsProfile']];
  };
  properties: {
    Row: TableRow<Property>;
    Insert: {
      id?: string;
      host_id: string;
      title: string;
      slug: string;
      description: string;
      property_type: AccommodationType;
      address_line1: string;
      address_line2?: string | null;
      city?: string;
      postal_code?: string | null;
      country?: string;
      district: string;
      nearest_station_name?: string | null;
      nearest_station_walk_min?: number | null;
      status?: PropertyStatus;
      booking_mode?: BookingMode;
      min_stay_nights?: number;
      monthly_price_min?: number | null;
      is_featured?: boolean;
      tags?: string[];
      published_at?: string | null;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      host_id?: string;
      title?: string;
      slug?: string;
      description?: string;
      property_type?: AccommodationType;
      address_line1?: string;
      address_line2?: string | null;
      city?: string;
      postal_code?: string | null;
      country?: string;
      district?: string;
      nearest_station_name?: string | null;
      nearest_station_walk_min?: number | null;
      status?: PropertyStatus;
      booking_mode?: BookingMode;
      min_stay_nights?: number;
      monthly_price_min?: number | null;
      is_featured?: boolean;
      tags?: string[];
      published_at?: string | null;
      deleted_at?: string | null;
      updated_at?: string;
    };
    Relationships: [DbRelationships['propertiesHost']];
  };
  rooms: {
    Row: TableRow<Room>;
    Insert: {
      id?: string;
      property_id: string;
      name: string;
      room_type?: string | null;
      size_sqm?: number | null;
      max_occupancy?: number;
      monthly_price_krw: number;
      status?: RoomStatus;
      available_from?: string | null;
      deleted_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      property_id?: string;
      name?: string;
      room_type?: string | null;
      size_sqm?: number | null;
      max_occupancy?: number;
      monthly_price_krw?: number;
      status?: RoomStatus;
      available_from?: string | null;
      deleted_at?: string | null;
      updated_at?: string;
    };
    Relationships: [DbRelationships['roomsProperty']];
  };
  property_images: {
    Row: TableRow<PropertyImage>;
    Insert: {
      id?: string;
      property_id: string;
      storage_path: string;
      sort_order?: number;
      alt_text?: string | null;
      is_cover?: boolean;
      created_at?: string;
    };
    Update: {
      property_id?: string;
      storage_path?: string;
      sort_order?: number;
      alt_text?: string | null;
      is_cover?: boolean;
    };
    Relationships: [DbRelationships['propertyImagesProperty']];
  };
  amenities: {
    Row: TableRow<Amenity>;
    Insert: {
      id?: string;
      slug: string;
      name: string;
      icon?: string | null;
      sort_order?: number;
      created_at?: string;
    };
    Update: {
      slug?: string;
      name?: string;
      icon?: string | null;
      sort_order?: number;
    };
    Relationships: [];
  };
  property_search_embeddings: {
    Row: TableRow<PropertySearchEmbedding & { embedding: string }>;
    Insert: {
      property_id: string;
      content: string;
      content_hash: string;
      embedding: string;
      updated_at?: string;
    };
    Update: {
      content?: string;
      content_hash?: string;
      embedding?: string;
      updated_at?: string;
    };
    Relationships: [
      {
        foreignKeyName: 'property_search_embeddings_property_id_fkey';
        columns: ['property_id'];
        isOneToOne: true;
        referencedRelation: 'properties';
        referencedColumns: ['id'];
      },
    ];
  };
  location_aliases: {
    Row: TableRow<LocationAlias>;
    Insert: {
      id?: string;
      alias: string;
      district: string;
      center_lat: number;
      center_lng: number;
      radius_meters?: number;
      created_at?: string;
    };
    Update: {
      alias?: string;
      district?: string;
      center_lat?: number;
      center_lng?: number;
      radius_meters?: number;
    };
    Relationships: [];
  };
  bookings: {
    Row: TableRow<Booking>;
    Insert: {
      id?: string;
      customer_id: string;
      room_id: string;
      property_id: string;
      check_in: string;
      check_out: string;
      guest_count: number;
      status: BookingStatus;
      booking_type: BookingType;
      hold_expires_at?: string | null;
      customer_notes?: string | null;
      approved_at?: string | null;
      approved_by?: string | null;
      cancelled_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      status?: BookingStatus;
      hold_expires_at?: string | null;
      approved_at?: string | null;
      approved_by?: string | null;
      cancelled_at?: string | null;
      updated_at?: string;
    };
    Relationships: [
      DbRelationships['bookingsCustomer'],
      DbRelationships['bookingsRoom'],
      DbRelationships['bookingsProperty'],
    ];
  };
  booking_price_snapshots: {
    Row: TableRow<BookingPriceSnapshot>;
    Insert: {
      booking_id: string;
      rent_krw: number;
      service_fee_krw: number;
      utilities_krw?: number;
      total_krw: number;
      pricing_version: string;
      nightly_breakdown?: unknown;
      created_at?: string;
    };
    Update: {
      rent_krw?: number;
      service_fee_krw?: number;
      utilities_krw?: number;
      total_krw?: number;
      pricing_version?: string;
      nightly_breakdown?: unknown;
    };
    Relationships: [DbRelationships['bookingSnapshotsBooking']];
  };
  payments: {
    Row: TableRow<Payment>;
    Insert: {
      id?: string;
      order_id: string;
      payment_key?: string | null;
      booking_id: string;
      customer_id: string;
      amount_krw: number;
      status?: PaymentStatus;
      toss_response?: unknown;
      failed_reason?: string | null;
      confirmed_at?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      payment_key?: string | null;
      status?: PaymentStatus;
      toss_response?: unknown;
      failed_reason?: string | null;
      confirmed_at?: string | null;
      updated_at?: string;
    };
    Relationships: [DbRelationships['paymentsBooking'], DbRelationships['paymentsCustomer']];
  };
  notifications: {
    Row: TableRow<NotificationRow>;
    Insert: {
      id?: string;
      user_id: string;
      type: NotificationType;
      title: string;
      body: string;
      metadata?: Record<string, unknown>;
      read_at?: string | null;
      created_at?: string;
    };
    Update: {
      read_at?: string | null;
    };
    Relationships: [DbRelationships['notificationsUser']];
  };
  housing_requests: {
    Row: TableRow<HousingRequestRow>;
    Insert: {
      id?: string;
      customer_id?: string | null;
      email: string;
      desired_area: string;
      check_in?: string | null;
      check_out?: string | null;
      budget_max?: number | null;
      accommodation_type?: AccommodationType | null;
      notes?: string | null;
      status?: HousingRequestStatus;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      status?: HousingRequestStatus;
      updated_at?: string;
    };
    Relationships: [];
  };
  audit_logs: {
    Row: TableRow<AuditLogRow>;
    Insert: {
      id?: string;
      actor_id: string;
      action: string;
      entity_type: string;
      entity_id?: string | null;
      metadata?: Record<string, unknown>;
      created_at?: string;
    };
    Update: {
      action?: string;
      entity_type?: string;
      entity_id?: string | null;
      metadata?: Record<string, unknown>;
    };
    Relationships: [DbRelationships['auditLogsActor']];
  };
  property_amenities: {
    Row: TableRow<PropertyAmenityRow>;
    Insert: {
      property_id: string;
      amenity_id: string;
    };
    Update: {
      property_id?: string;
      amenity_id?: string;
    };
    Relationships: [
      DbRelationships['propertyAmenitiesProperty'],
      DbRelationships['propertyAmenitiesAmenity'],
    ];
  };
};

type PublicFunctions = {
  submit_property_for_review: {
    Args: { p_property_id: string };
    Returns: Property;
  };
  publish_property: {
    Args: { p_property_id: string };
    Returns: Property;
  };
  reject_property_review: {
    Args: { p_property_id: string };
    Returns: Property;
  };
  search_properties: {
    Args: {
      p_filters?: Record<string, unknown>;
      p_limit?: number;
      p_offset?: number;
    };
    Returns: Array<{
      id: string;
      title: string;
      slug: string;
      property_type: AccommodationType;
      district: string;
      nearest_station_name: string | null;
      monthly_price_min: number;
      tags: string[] | null;
      cover_storage_path: string | null;
      cover_alt_text: string | null;
      latitude: number;
      longitude: number;
      distance_meters: number | null;
      total_count: number;
    }>;
  };
  search_properties_hybrid: {
    Args: {
      p_filters?: Record<string, unknown>;
      p_limit?: number;
      p_offset?: number;
      p_query_embedding?: string | null;
      p_reference_embedding?: string | null;
      p_match_threshold?: number;
    };
    Returns: Array<{
      id: string;
      title: string;
      slug: string;
      property_type: AccommodationType;
      district: string;
      nearest_station_name: string | null;
      monthly_price_min: number;
      tags: string[] | null;
      cover_storage_path: string | null;
      cover_alt_text: string | null;
      latitude: number;
      longitude: number;
      distance_meters: number | null;
      total_count: number;
    }>;
  };
  build_property_search_document: {
    Args: { p_property_id: string };
    Returns: string;
  };
  get_property_coordinates: {
    Args: { p_property_id: string };
    Returns: Array<{
      latitude: number;
      longitude: number;
    }>;
  };
  quote_booking: {
    Args: {
      p_room_id: string;
      p_check_in: string;
      p_check_out: string;
      p_guest_count: number;
    };
    Returns: Array<{
      room_id: string;
      property_id: string;
      booking_mode: BookingMode;
      nights: number;
      rent_krw: number;
      service_fee_krw: number;
      total_krw: number;
      pricing_version: string;
    }>;
  };
  create_booking_hold: {
    Args: {
      p_room_id: string;
      p_check_in: string;
      p_check_out: string;
      p_guest_count: number;
      p_customer_notes?: string | null;
    };
    Returns: Booking;
  };
  approve_booking_request: {
    Args: { p_booking_id: string };
    Returns: Booking;
  };
  reject_booking_request: {
    Args: { p_booking_id: string };
    Returns: Booking;
  };
  cancel_own_booking: {
    Args: { p_booking_id: string };
    Returns: Booking;
  };
  create_payment_order: {
    Args: { p_booking_id: string };
    Returns: Array<{
      payment_id: string;
      order_id: string;
      booking_id: string;
      amount_krw: number;
      order_name: string;
    }>;
  };
  register_as_host: {
    Args: { p_display_name: string };
    Returns: Host;
  };
  set_property_location: {
    Args: {
      p_property_id: string;
      p_latitude: number;
      p_longitude: number;
    };
    Returns: Property;
  };
  get_host_property_coordinates: {
    Args: { p_property_id: string };
    Returns: Array<{
      latitude: number;
      longitude: number;
    }>;
  };
  approve_host: {
    Args: { p_host_id: string };
    Returns: Host;
  };
  update_housing_request_status: {
    Args: {
      p_request_id: string;
      p_status: HousingRequestStatus;
    };
    Returns: HousingRequestRow;
  };
  get_unread_notification_count: {
    Args: Record<string, unknown>;
    Returns: number;
  };
  mark_notification_read: {
    Args: { p_notification_id: string };
    Returns: NotificationRow;
  };
  mark_all_notifications_read: {
    Args: Record<string, unknown>;
    Returns: number;
  };
};

export type Database = {
  public: {
    Tables: PublicTables;
    Views: {
      [_ in never]: never;
    };
    Functions: PublicFunctions;
  };
};
