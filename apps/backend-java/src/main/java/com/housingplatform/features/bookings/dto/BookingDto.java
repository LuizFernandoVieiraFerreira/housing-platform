package com.housingplatform.features.bookings.dto;

import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingDto(
    UUID id,
    UUID customerId,
    UUID roomId,
    UUID propertyId,
    LocalDate checkIn,
    LocalDate checkOut,
    @Min(1) int guestCount,
    BookingStatus status,
    BookingType bookingType,
    OffsetDateTime holdExpiresAt,
    String customerNotes,
    OffsetDateTime approvedAt,
    UUID approvedBy,
    OffsetDateTime cancelledAt,
    @Min(0) int paymentRetryCount,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
