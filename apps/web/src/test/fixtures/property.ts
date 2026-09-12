import type { PropertyDetail, PropertyDetailRoom } from '@housing-platform/types';

export function createPropertyRoom(
  overrides: Partial<PropertyDetailRoom> = {},
): PropertyDetailRoom {
  return {
    id: 'room-1',
    name: 'Standard Room',
    roomType: 'private',
    sizeSqm: 15,
    maxOccupancy: 2,
    monthlyPriceKrw: 800_000,
    status: 'available',
    availableFrom: null,
    ...overrides,
  };
}

export function createPropertyDetail(
  overrides: Partial<PropertyDetail> = {},
): PropertyDetail {
  return {
    id: 'property-1',
    title: 'Cozy Studio in Hongdae',
    slug: 'cozy-studio-hongdae',
    description: 'A comfortable studio apartment in the heart of Hongdae.',
    propertyType: 'studio',
    district: 'Mapo-gu',
    nearestStationName: 'Hongdae Station',
    nearestStationWalkMin: 5,
    addressLine1: '123 Hongdae Street',
    addressLine2: null,
    city: 'Seoul',
    bookingMode: 'instant',
    minStayNights: 30,
    monthlyPriceMin: 800_000,
    tags: ['wifi', 'washing-machine'],
    hostDisplayName: 'John Host',
    latitude: 37.5563,
    longitude: 126.9236,
    images: [
      {
        id: 'img-1',
        storagePath: 'properties/1/cover.jpg',
        url: 'https://example.com/cover.jpg',
        altText: 'Living room',
        sortOrder: 0,
        isCover: true,
      },
    ],
    rooms: [createPropertyRoom()],
    amenities: [
      { id: 'amenity-1', slug: 'wifi', name: 'WiFi', icon: 'wifi' },
      { id: 'amenity-2', slug: 'washing-machine', name: 'Washing Machine', icon: 'washing-machine' },
    ],
    ...overrides,
  };
}
