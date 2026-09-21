import type { hosts } from '@prisma/client';

import {
  formatCalendarDate,
  formatDateTime,
} from '../../bookings/mappers/booking.mapper';
import type { BookingStatus, BookingType } from '../../bookings/dto/booking-enums.dto';
import {
  accommodationTypeToApi,
  bookingModeToApi,
  propertyStatusToApi,
} from '../../properties/mappers/property.mapper';
import type { HostBookingDto } from '../dto/host-booking.dto';
import type { HostPropertyListItemDto } from '../dto/host-property-list-item.dto';
import { HostStatus } from '../dto/host-status.dto';
import type { HostDto } from '../dto/host.dto';

function hostStatusToApi(value: string): HostStatus {
  switch (value) {
    case 'active':
      return HostStatus.Active;
    case 'suspended':
      return HostStatus.Suspended;
    default:
      return HostStatus.Pending;
  }
}

export function mapHost(host: hosts): HostDto {
  return {
    id: host.id,
    profileId: host.profile_id,
    displayName: host.display_name,
    status: hostStatusToApi(host.status),
    verifiedAt: host.verified_at ? formatDateTime(host.verified_at) : null,
    createdAt: formatDateTime(host.created_at),
    updatedAt: formatDateTime(host.updated_at),
  };
}

export function mapHostPropertyListItem(row: {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  district: string;
  status: string;
  bookingMode: string;
  monthlyPriceMin: number | null;
  roomCount: number;
  updatedAt: Date;
}): HostPropertyListItemDto {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: accommodationTypeToApi(row.propertyType),
    district: row.district,
    status: propertyStatusToApi(row.status as Parameters<typeof propertyStatusToApi>[0]),
    bookingMode: bookingModeToApi(row.bookingMode as Parameters<typeof bookingModeToApi>[0]),
    monthlyPriceMin: row.monthlyPriceMin,
    roomCount: row.roomCount,
    updatedAt: formatDateTime(row.updatedAt),
  };
}

export function mapHostBooking(row: {
  id: string;
  status: string;
  bookingType: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  customerNotes: string | null;
  propertyTitle: string;
  roomName: string;
  totalKrw: number;
  createdAt: Date;
}): HostBookingDto {
  return {
    id: row.id,
    status: row.status as BookingStatus,
    bookingType: row.bookingType as BookingType,
    checkIn: formatCalendarDate(row.checkIn),
    checkOut: formatCalendarDate(row.checkOut),
    guestCount: row.guestCount,
    customerNotes: row.customerNotes,
    propertyTitle: row.propertyTitle,
    roomName: row.roomName,
    totalKrw: row.totalKrw,
    createdAt: formatDateTime(row.createdAt),
  };
}
