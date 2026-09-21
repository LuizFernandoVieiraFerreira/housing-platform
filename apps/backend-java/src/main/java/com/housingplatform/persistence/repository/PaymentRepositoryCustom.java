package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.enums.PaymentStatus;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepositoryCustom {

  record PaymentLookupRow(
      UUID id,
      UUID orderId,
      UUID bookingId,
      UUID customerId,
      int amountKrw,
      PaymentStatus status) {}

  record PaymentOrderRow(
      UUID paymentId, UUID orderId, UUID bookingId, int amountKrw, String orderName) {}

  Optional<PaymentLookupRow> findByOrderId(UUID orderId);

  PaymentOrderRow createPaymentOrder(UUID bookingId, UUID customerId);

  Payment finalizeSuccessfulPayment(
      UUID orderId, String paymentKey, int amountKrw, Map<String, Object> tossResponse);

  Payment markPaymentFailed(UUID orderId, String reason, Map<String, Object> tossResponse);

  void recordPaymentEvent(
      String eventId,
      UUID paymentId,
      UUID bookingId,
      String eventType,
      Map<String, Object> payload);

  RuntimeException mapFinalizeError(RuntimeException exception);
}
