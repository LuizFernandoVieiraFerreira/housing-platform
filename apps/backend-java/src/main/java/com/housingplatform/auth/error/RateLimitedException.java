package com.housingplatform.auth.error;

public class RateLimitedException extends AppException {
  public RateLimitedException(String message) {
    super("RATE_LIMITED", message, 429);
  }
}
