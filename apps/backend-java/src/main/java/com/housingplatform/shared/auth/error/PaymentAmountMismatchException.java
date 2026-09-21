package com.housingplatform.shared.auth.error;

public class PaymentAmountMismatchException extends AppException {
  public PaymentAmountMismatchException(String message) {
    super("PAYMENT_AMOUNT_MISMATCH", message, 409);
  }
}
