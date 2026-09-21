package com.housingplatform.shared.auth.error;

import java.util.Map;

public class BadRequestException extends AppException {
  public BadRequestException(String message) {
    super("VALIDATION_ERROR", message, 400);
  }

  public BadRequestException(String message, Map<String, Object> details) {
    super("VALIDATION_ERROR", message, 400, details);
  }
}
