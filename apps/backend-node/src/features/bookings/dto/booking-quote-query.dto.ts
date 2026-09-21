/** GET /bookings/quote query parameters. */
export interface BookingQuoteQueryDto {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
}
