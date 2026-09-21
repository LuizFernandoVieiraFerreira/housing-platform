package com.housingplatform.shared.auth.error;

public class ConflictException extends AppException {
  public ConflictException(String message) {
    super("BOOKING_CONFLICT", message, 409);
  }
}
