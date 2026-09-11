export type AccommodationType = 'share-house' | 'studio' | 'micro-studio' | 'multi-bedroom';

export type PropertyStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export type BookingMode = 'instant' | 'request';

export type RoomStatus = 'available' | 'unavailable' | 'archived';

export interface Property {
  id: string;
  host_id: string;
  title: string;
  slug: string;
  description: string;
  property_type: AccommodationType;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  district: string;
  nearest_station_name: string | null;
  nearest_station_walk_min: number | null;
  status: PropertyStatus;
  booking_mode: BookingMode;
  min_stay_nights: number;
  monthly_price_min: number | null;
  is_featured: boolean;
  tags: string[];
  published_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  room_type: string | null;
  size_sqm: number | null;
  max_occupancy: number;
  monthly_price_krw: number;
  status: RoomStatus;
  available_from: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  storage_path: string;
  sort_order: number;
  alt_text: string | null;
  is_cover: boolean;
  created_at: string;
}

export interface Amenity {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

export interface LocationAlias {
  id: string;
  alias: string;
  district: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  created_at: string;
}

export interface PropertySearchEmbedding {
  property_id: string;
  content: string;
  content_hash: string;
  updated_at: string;
}

export interface FeaturedPropertyCard {
  id: string;
  title: string;
  slug: string;
  propertyType: AccommodationType;
  district: string;
  nearestStationName: string | null;
  monthlyPriceMin: number;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  tags: string[];
}

export type PropertySearchSort =
  'recommended' | 'price_asc' | 'price_desc' | 'distance' | 'semantic';

export interface PropertySearchFilters {
  query?: string;
  propertyType?: AccommodationType;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  sort?: PropertySearchSort;
  centerLat?: number;
  centerLng?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
  amenitySlugs?: string[];
  maxStationWalkMin?: number;
  excludePropertyIds?: string[];
}

export interface SearchPropertyCard extends FeaturedPropertyCard {
  latitude: number;
  longitude: number;
  distanceMeters: number | null;
}

export interface PropertySearchResult {
  items: SearchPropertyCard[];
  totalCount: number;
}

export interface AiPropertySearchContext {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  mapCenterLat?: number;
  mapCenterLng?: number;
}

export interface AiPropertySearchRequest {
  query?: string;
  referencePropertyId?: string;
  context?: AiPropertySearchContext;
  limit?: number;
}

export interface AiPropertySearchResponse {
  items: SearchPropertyCard[];
  totalCount: number;
  interpretedFilters: PropertySearchFilters;
  explanation?: string;
  fallbackUsed?: boolean;
}

export interface PropertyDetailRoom {
  id: string;
  name: string;
  roomType: string | null;
  sizeSqm: number | null;
  maxOccupancy: number;
  monthlyPriceKrw: number;
  status: RoomStatus;
  availableFrom: string | null;
}

export interface PropertyDetailAmenity {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export interface PropertyDetailImage {
  id: string;
  storagePath: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isCover: boolean;
}

export interface PropertyDetail {
  id: string;
  title: string;
  slug: string;
  description: string;
  propertyType: AccommodationType;
  district: string;
  nearestStationName: string | null;
  nearestStationWalkMin: number | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  bookingMode: BookingMode;
  minStayNights: number;
  monthlyPriceMin: number;
  tags: string[];
  hostDisplayName: string;
  latitude: number | null;
  longitude: number | null;
  images: PropertyDetailImage[];
  rooms: PropertyDetailRoom[];
  amenities: PropertyDetailAmenity[];
}

export interface AmenityOption {
  id: string;
  slug: string;
  name: string;
}
