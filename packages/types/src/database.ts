import type { Profile, UserRole } from './auth';
import type { Booking, BookingPriceSnapshot, BookingStatus, BookingType } from './bookings';
import type { Host, HostStatus } from './host';
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
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
        Row: Host;
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
        Relationships: [];
      };
      properties: {
        Row: Property;
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
        Relationships: [];
      };
      rooms: {
        Row: Room;
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
        Relationships: [];
      };
      property_images: {
        Row: PropertyImage;
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
        Relationships: [];
      };
      amenities: {
        Row: Amenity;
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
        Row: PropertySearchEmbedding & { embedding: string };
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
        Relationships: [];
      };
      location_aliases: {
        Row: LocationAlias;
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
        Row: Booking;
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
        Relationships: [];
      };
      booking_price_snapshots: {
        Row: BookingPriceSnapshot;
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
        Relationships: [];
      };
      payments: {
        Row: Payment;
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
        Relationships: [];
      };
    };
    Functions: {
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
    };
  };
}
