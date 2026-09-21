import { formatCalendarDate, formatDateTime } from '../../bookings/mappers/booking.mapper';
import { mapHostPropertyListItem } from '../../hosts/mappers/host.mapper';
import { PaymentStatus } from '../../payments/dto/payment-status.dto';
import { propertyStatusToApi } from '../../properties/mappers/property.mapper';
import type { PropertyStatusChange } from '../../properties/dto/property-status-change';
import type { AdminHostDto } from '../dto/admin-host.dto';
import type { AdminPaymentDto } from '../dto/admin-payment.dto';
import type { AdminPropertyDto } from '../dto/admin-property.dto';
import type { AuditLogDto } from '../dto/audit-log.dto';
import type { HousingRequestDto } from '../dto/housing-request.dto';
import { HousingRequestStatus } from '../dto/housing-request-status.dto';

export function mapAdminProperty(row: {
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
  hostDisplayName: string;
}): AdminPropertyDto {
  return {
    ...mapHostPropertyListItem(row),
    hostDisplayName: row.hostDisplayName,
  };
}

export function mapAdminHost(row: {
  id: string;
  displayName: string;
  status: string;
  profileName: string;
  verifiedAt: Date | null;
  createdAt: Date;
}): AdminHostDto {
  return {
    id: row.id,
    displayName: row.displayName,
    status: row.status,
    profileName: row.profileName,
    verifiedAt: row.verifiedAt ? formatDateTime(row.verifiedAt) : null,
    createdAt: formatDateTime(row.createdAt),
  };
}

export function mapAdminPayment(row: {
  id: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  status: string;
  propertyTitle: string | null;
  customerName: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
}): AdminPaymentDto {
  return {
    id: row.id,
    orderId: row.orderId,
    bookingId: row.bookingId,
    amountKrw: row.amountKrw,
    status: row.status as PaymentStatus,
    propertyTitle: row.propertyTitle,
    customerName: row.customerName,
    confirmedAt: row.confirmedAt ? formatDateTime(row.confirmedAt) : null,
    createdAt: formatDateTime(row.createdAt),
  };
}

export function mapHousingRequest(row: {
  id: string;
  email: string;
  desiredArea: string;
  checkIn: Date | null;
  checkOut: Date | null;
  budgetMax: number | null;
  accommodationType: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
}): HousingRequestDto {
  return {
    id: row.id,
    email: row.email,
    desiredArea: row.desiredArea,
    checkIn: row.checkIn ? formatCalendarDate(row.checkIn) : null,
    checkOut: row.checkOut ? formatCalendarDate(row.checkOut) : null,
    budgetMax: row.budgetMax,
    accommodationType: row.accommodationType,
    notes: row.notes,
    status: row.status as HousingRequestStatus,
    createdAt: formatDateTime(row.createdAt),
  };
}

export function mapAuditLog(row: {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}): AuditLogDto {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    actorName: row.actorName,
    metadata: row.metadata,
    createdAt: formatDateTime(row.createdAt),
  };
}

export function mapPropertyStatusChange(
  propertyId: string,
  status: string,
): PropertyStatusChange {
  return {
    id: propertyId,
    status: propertyStatusToApi(status as Parameters<typeof propertyStatusToApi>[0]),
  };
}
