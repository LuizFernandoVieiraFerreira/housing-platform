package com.housingplatform.features.bookings.dto;

import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingListItem(
    UUID id,
    BookingStatus status,
    BookingType bookingType,
    LocalDate checkIn,
    LocalDate checkOut,
    @Min(1) int guestCount,
    String propertyTitle,
    String district,
    String roomName,
    @Min(0) int totalKrw,
    OffsetDateTime holdExpiresAt,
    OffsetDateTime createdAt) {}
