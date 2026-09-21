package com.housingplatform.features.payments.dto;

import jakarta.validation.constraints.Min;
import java.util.UUID;

public record CreatePaymentOrderResult(
    UUID paymentId,
    UUID orderId,
    UUID bookingId,
    @Min(1) int amountKrw,
    String orderName) {}
