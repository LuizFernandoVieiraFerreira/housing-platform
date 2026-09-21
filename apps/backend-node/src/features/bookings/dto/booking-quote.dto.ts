import type { BookingMode } from './booking-enums.dto';

/** OpenAPI BookingQuote response. */
export interface BookingQuoteDto {
  roomId: string;
  propertyId: string;
  bookingMode: BookingMode;
  nights: number;
  rentKrw: number;
  serviceFeeKrw: number;
  totalKrw: number;
  pricingVersion: string;
}
