package com.housingplatform.features.payments.mapper;

import com.housingplatform.features.payments.dto.ConfirmPaymentResult;
import com.housingplatform.features.payments.dto.CreatePaymentOrderResult;
import com.housingplatform.persistence.entity.Payment;
import java.util.UUID;

public final class PaymentMapper {

  private PaymentMapper() {}

  public static CreatePaymentOrderResult toCreateOrderResult(
      UUID paymentId, UUID orderId, UUID bookingId, int amountKrw, String orderName) {
    return new CreatePaymentOrderResult(paymentId, orderId, bookingId, amountKrw, orderName);
  }

  public static ConfirmPaymentResult toConfirmResult(Payment payment) {
    return new ConfirmPaymentResult(
        payment.getId(), payment.getOrderId(), payment.getBookingId(), payment.getStatus());
  }

  public static ConfirmPaymentResult toConfirmResult(
      UUID paymentId, UUID orderId, UUID bookingId, com.housingplatform.persistence.enums.PaymentStatus status) {
    return new ConfirmPaymentResult(paymentId, orderId, bookingId, status);
  }
}
