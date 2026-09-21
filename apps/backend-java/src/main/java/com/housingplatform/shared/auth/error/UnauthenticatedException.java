package com.housingplatform.shared.auth.error;

public class UnauthenticatedException extends AppException {

  public UnauthenticatedException() {
    this("Authentication required");
  }

  public UnauthenticatedException(String message) {
    super("UNAUTHENTICATED", message, 401);
  }
}
