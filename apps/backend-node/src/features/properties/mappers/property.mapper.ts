import { randomUUID } from 'node:crypto';

import type {
  amenities,
  accommodation_type,
  booking_mode,
  properties,
  property_images,
  property_status,
  room_status,
  rooms,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { StorageUrlResolver } from '../../../shared/storage/storage-url.resolver';
import { AccommodationType } from '../dto/accommodation-type';
import { BookingMode } from '../dto/booking-mode';
import type { CreateRoomRequest } from '../dto/create-room-request';
import type { HostPropertyDetail } from '../dto/host-property-detail';
import type { HostPropertyRequest } from '../dto/host-property-request';
import type { HostRoomDto } from '../dto/host-room';
import type { PropertyAmenityDto } from '../dto/property-amenity';
import type { PropertyDetail } from '../dto/property-detail';
import type { PropertyImageDto } from '../dto/property-image';
import type { PropertyRoomDto } from '../dto/property-room';
import { PropertyStatus } from '../dto/property-status';
import { RoomStatus } from '../dto/room-status';
import type { SearchPropertyCard } from '../dto/search-property-card';

const SLUG_SANITIZER = /[^a-z0-9]+/g;

export function createPropertySlug(title: string): string {
  const base = title.toLowerCase().replace(SLUG_SANITIZER, '-').replace(/^-|-$/g, '');
  return `${base || 'listing'}-${randomUUID().slice(0, 8)}`;
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  return tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, 20);
}

export function accommodationTypeToApi(value: string): AccommodationType {
  switch (value) {
    case 'share-house':
    case 'share_house':
      return AccommodationType.ShareHouse;
    case 'micro-studio':
    case 'micro_studio':
      return AccommodationType.MicroStudio;
    case 'multi-bedroom':
    case 'multi_bedroom':
      return AccommodationType.MultiBedroom;
    default:
      return AccommodationType.Studio;
  }
}

export function accommodationTypeFromApi(
  value: AccommodationType,
): accommodation_type {
  switch (value) {
    case AccommodationType.ShareHouse:
      return 'share_house';
    case AccommodationType.MicroStudio:
      return 'micro_studio';
    case AccommodationType.MultiBedroom:
      return 'multi_bedroom';
    default:
      return 'studio';
  }
}

export function bookingModeToApi(value: booking_mode): BookingMode {
  return value === 'instant' ? BookingMode.Instant : BookingMode.Request;
}

export function bookingModeFromApi(value: BookingMode): booking_mode {
  return value === BookingMode.Instant ? 'instant' : 'request';
}

export function propertyStatusToApi(value: property_status): PropertyStatus {
  switch (value) {
    case 'draft':
      return PropertyStatus.Draft;
    case 'pending_review':
      return PropertyStatus.PendingReview;
    case 'published':
      return PropertyStatus.Published;
    default:
      return PropertyStatus.Archived;
  }
}

export function roomStatusToApi(value: room_status): RoomStatus {
  switch (value) {
    case 'available':
      return RoomStatus.Available;
    case 'unavailable':
      return RoomStatus.Unavailable;
    default:
      return RoomStatus.Archived;
  }
}

function formatDateOnly(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

function decimalToNumber(value: Decimal | null): number | null {
  if (value == null) {
    return null;
  }
  return Number(value);
}

export function requestToPropertyFields(request: HostPropertyRequest) {
  return {
    title: request.title,
    description: request.description,
    property_type: accommodationTypeFromApi(request.propertyType),
    address_line1: request.addressLine1,
    address_line2: request.addressLine2 ?? null,
    city: request.city,
    postal_code: request.postalCode ?? null,
    district: request.district,
    nearest_station_name: request.nearestStationName ?? null,
    nearest_station_walk_min: request.nearestStationWalkMin ?? null,
    booking_mode: bookingModeFromApi(request.bookingMode),
    min_stay_nights: request.minStayNights,
  };
}

export function roomTypeOrNull(request: CreateRoomRequest): string | null {
  const value = request.roomType?.trim();
  return value ? value : null;
}

export function mapSearchPropertyCard(
  row: {
    id: string;
    title: string;
    slug: string;
    propertyType: string;
    district: string;
    nearestStationName: string | null;
    monthlyPriceMin: number;
    tags: string[] | null;
    coverStoragePath: string | null;
    coverAltText: string | null;
    latitude: number;
    longitude: number;
    distanceMeters: number | null;
  },
  storage: StorageUrlResolver,
): SearchPropertyCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: accommodationTypeToApi(row.propertyType),
    district: row.district,
    nearestStationName: row.nearestStationName,
    monthlyPriceMin: row.monthlyPriceMin,
    coverImageUrl: row.coverStoragePath
      ? storage.resolvePropertyImageUrl(row.coverStoragePath)
      : null,
    coverImageAlt: row.coverAltText,
    tags: row.tags ?? [],
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distanceMeters,
  };
}

function mapPropertyImages(
  images: property_images[],
  storage: StorageUrlResolver,
): PropertyImageDto[] {
  return [...images]
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) {
        return a.is_cover ? -1 : 1;
      }
      return a.sort_order - b.sort_order;
    })
    .map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      url: storage.resolvePropertyImageUrl(image.storage_path) ?? '',
      altText: image.alt_text,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
    }));
}

function mapPropertyRooms(roomsList: rooms[]): PropertyRoomDto[] {
  return roomsList
    .filter((room) => room.deleted_at == null && room.status === 'available')
    .sort((a, b) => a.monthly_price_krw - b.monthly_price_krw)
    .map((room) => ({
      id: room.id,
      name: room.name,
      roomType: room.room_type,
      sizeSqm: decimalToNumber(room.size_sqm),
      maxOccupancy: room.max_occupancy,
      monthlyPriceKrw: room.monthly_price_krw,
      status: roomStatusToApi(room.status),
      availableFrom: formatDateOnly(room.available_from),
    }));
}

function mapPropertyAmenities(amenitiesList: amenities[]): PropertyAmenityDto[] {
  return [...amenitiesList]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((amenity) => mapAmenityDto(amenity));
}

export function mapAmenityDto(amenity: amenities): PropertyAmenityDto {
  return {
    id: amenity.id,
    slug: amenity.slug,
    name: amenity.name,
    icon: amenity.icon,
  };
}

export function mapPropertyDetail(
  propertyRow: properties & {
    property_images: property_images[];
    rooms: rooms[];
  },
  options: {
    hostDisplayName: string;
    latitude: number | null;
    longitude: number | null;
    amenities: amenities[];
    storage: StorageUrlResolver;
  },
): PropertyDetail {
  return {
    id: propertyRow.id,
    title: propertyRow.title,
    slug: propertyRow.slug,
    description: propertyRow.description,
    propertyType: accommodationTypeToApi(propertyRow.property_type),
    district: propertyRow.district,
    nearestStationName: propertyRow.nearest_station_name,
    nearestStationWalkMin: propertyRow.nearest_station_walk_min,
    addressLine1: propertyRow.address_line1,
    addressLine2: propertyRow.address_line2,
    city: propertyRow.city,
    bookingMode: bookingModeToApi(propertyRow.booking_mode),
    minStayNights: propertyRow.min_stay_nights,
    monthlyPriceMin: propertyRow.monthly_price_min ?? 0,
    tags: propertyRow.tags,
    hostDisplayName: options.hostDisplayName,
    latitude: options.latitude,
    longitude: options.longitude,
    images: mapPropertyImages(propertyRow.property_images, options.storage),
    rooms: mapPropertyRooms(propertyRow.rooms),
    amenities: mapPropertyAmenities(options.amenities),
  };
}

function mapHostRooms(roomsList: rooms[]): HostRoomDto[] {
  return roomsList
    .filter((room) => room.deleted_at == null)
    .map((room) => mapHostRoom(room));
}

export function mapHostRoom(room: rooms): HostRoomDto {
  return {
    id: room.id,
    name: room.name,
    roomType: room.room_type,
    sizeSqm: decimalToNumber(room.size_sqm),
    maxOccupancy: room.max_occupancy,
    monthlyPriceKrw: room.monthly_price_krw,
    status: roomStatusToApi(room.status),
    availableFrom: formatDateOnly(room.available_from),
  };
}

export function mapHostPropertyDetail(
  propertyRow: properties & { rooms: rooms[] },
  options: {
    latitude: number | null;
    longitude: number | null;
    amenityIds: string[];
  },
): HostPropertyDetail {
  return {
    id: propertyRow.id,
    title: propertyRow.title,
    slug: propertyRow.slug,
    description: propertyRow.description,
    propertyType: accommodationTypeToApi(propertyRow.property_type),
    addressLine1: propertyRow.address_line1,
    addressLine2: propertyRow.address_line2,
    city: propertyRow.city,
    postalCode: propertyRow.postal_code,
    district: propertyRow.district,
    nearestStationName: propertyRow.nearest_station_name,
    nearestStationWalkMin: propertyRow.nearest_station_walk_min,
    status: propertyStatusToApi(propertyRow.status),
    bookingMode: bookingModeToApi(propertyRow.booking_mode),
    minStayNights: propertyRow.min_stay_nights,
    tags: propertyRow.tags,
    latitude: options.latitude,
    longitude: options.longitude,
    amenityIds: options.amenityIds,
    rooms: mapHostRooms(propertyRow.rooms),
  };
}
