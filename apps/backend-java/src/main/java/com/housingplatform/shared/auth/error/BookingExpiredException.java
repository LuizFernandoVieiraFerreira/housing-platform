package com.housingplatform.shared.auth.error;

public class BookingExpiredException extends AppException {
  public BookingExpiredException(String message) {
    super("BOOKING_EXPIRED", message, 409);
  }
}
