import type { HostPropertyListItem, HostStatus } from './host';
import type { AccommodationType } from './properties';
import type { PaymentStatus } from './payments';

export type HousingRequestStatus = 'new' | 'in_progress' | 'closed';

export interface HousingRequestListItem {
  id: string;
  email: string;
  desiredArea: string;
  checkIn: string | null;
  checkOut: string | null;
  budgetMax: number | null;
  accommodationType: AccommodationType | null;
  notes: string | null;
  status: HousingRequestStatus;
  createdAt: string;
}

export interface AdminHostListItem {
  id: string;
  displayName: string;
  status: HostStatus;
  profileName: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface AdminPropertyListItem extends HostPropertyListItem {
  hostDisplayName: string;
}

export interface AdminPaymentListItem {
  id: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  status: PaymentStatus;
  propertyTitle: string | null;
  customerName: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface AuditLogListItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AdminDashboardStats {
  pendingProperties: number;
  pendingHosts: number;
  openBookings: number;
  openHousingRequests: number;
}
