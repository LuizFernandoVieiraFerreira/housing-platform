package com.housingplatform.shared.auth.error;

public class NotFoundException extends AppException {
  public NotFoundException(String message) {
    super("NOT_FOUND", message, 404);
  }
}
