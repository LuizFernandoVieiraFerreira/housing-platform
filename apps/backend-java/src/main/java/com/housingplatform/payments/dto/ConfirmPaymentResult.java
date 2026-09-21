package com.housingplatform.payments.dto;

import com.housingplatform.persistence.enums.PaymentStatus;
import java.util.UUID;

public record ConfirmPaymentResult(
    UUID paymentId, UUID orderId, UUID bookingId, PaymentStatus status) {}
