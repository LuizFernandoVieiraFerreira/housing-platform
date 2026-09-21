import type { BookingListItemDto } from './booking-list-item.dto';

/** OpenAPI BookingDetail response. */
export interface BookingDetailDto extends BookingListItemDto {
  customerNotes: string | null;
  rentKrw: number;
  serviceFeeKrw: number;
  serviceFeePercent: number;
  pricingVersion: string;
  propertyId: string;
  roomId: string;
}
