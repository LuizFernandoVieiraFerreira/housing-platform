package com.housingplatform.auth.error;

public class ExternalServiceException extends AppException {
  public ExternalServiceException(String message) {
    super("EXTERNAL_SERVICE_ERROR", message, 502);
  }
}
