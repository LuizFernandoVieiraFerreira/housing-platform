package com.housingplatform.persistence.entity.support;

import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.enums.PaymentStatus;
import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;

public final class PaymentFactory {

  private PaymentFactory() {}

  public static Payment pendingPayment(UUID orderId, UUID bookingId, int amountKrw) {
    Payment payment = newPayment();
    setField(payment, "orderId", orderId);
    setField(payment, "bookingId", bookingId);
    setField(payment, "amountKrw", amountKrw);
    setField(payment, "status", PaymentStatus.pending);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    setField(payment, "createdAt", now);
    setField(payment, "updatedAt", now);
    return payment;
  }

  public static void applyConfirmed(
      Payment payment,
      String paymentKey,
      Map<String, Object> tossResponse,
      boolean bookingAlreadyConfirmed) {
    setField(payment, "status", PaymentStatus.confirmed);
    setField(payment, "paymentKey", paymentKey);
    if (bookingAlreadyConfirmed) {
      setField(
          payment,
          "tossResponse",
          tossResponse != null ? tossResponse : payment.getTossResponse());
      if (payment.getConfirmedAt() == null) {
        setField(payment, "confirmedAt", OffsetDateTime.now(ZoneOffset.UTC));
      }
    } else {
      setField(payment, "tossResponse", tossResponse);
      setField(payment, "confirmedAt", OffsetDateTime.now(ZoneOffset.UTC));
    }
    setField(payment, "updatedAt", OffsetDateTime.now(ZoneOffset.UTC));
  }

  public static void applyFailed(Payment payment, String reason, Map<String, Object> tossResponse) {
    setField(payment, "status", PaymentStatus.failed);
    String trimmed = reason == null ? null : reason.strip();
    setField(
        payment,
        "failedReason",
        trimmed == null || trimmed.isEmpty() ? null : trimmed);
    setField(
        payment,
        "tossResponse",
        tossResponse != null ? tossResponse : payment.getTossResponse());
    setField(payment, "updatedAt", OffsetDateTime.now(ZoneOffset.UTC));
  }

  private static Payment newPayment() {
    try {
      var constructor = Payment.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create payment entity", exception);
    }
  }

  private static void setField(Object target, String fieldName, Object value) {
    try {
      Field field = target.getClass().getDeclaredField(fieldName);
      field.setAccessible(true);
      field.set(target, value);
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to set " + fieldName, exception);
    }
  }
}
