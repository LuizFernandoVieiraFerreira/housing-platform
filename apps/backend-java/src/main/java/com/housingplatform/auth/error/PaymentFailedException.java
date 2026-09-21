package com.housingplatform.auth.error;

public class PaymentFailedException extends AppException {
  public PaymentFailedException(String message) {
    super("PAYMENT_FAILED", message, 409);
  }
}
