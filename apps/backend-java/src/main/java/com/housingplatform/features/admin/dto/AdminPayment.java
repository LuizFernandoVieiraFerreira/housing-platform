package com.housingplatform.features.admin.dto;

import com.housingplatform.persistence.enums.PaymentStatus;
import jakarta.validation.constraints.Min;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminPayment(
    UUID id,
    UUID orderId,
    UUID bookingId,
    @Min(0) int amountKrw,
    PaymentStatus status,
    String propertyTitle,
    String customerName,
    OffsetDateTime confirmedAt,
    OffsetDateTime createdAt) {}
