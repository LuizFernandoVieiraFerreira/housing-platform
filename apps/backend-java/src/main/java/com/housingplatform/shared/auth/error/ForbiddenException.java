package com.housingplatform.shared.auth.error;

public class ForbiddenException extends AppException {

  public ForbiddenException() {
    this("Forbidden");
  }

  public ForbiddenException(String message) {
    super("FORBIDDEN", message, 403);
  }
}
