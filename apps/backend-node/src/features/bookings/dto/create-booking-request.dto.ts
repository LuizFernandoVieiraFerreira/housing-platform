/** OpenAPI CreateBookingRequest body. */
export interface CreateBookingRequestDto {
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  customerNotes?: string | null;
}
