package com.housingplatform.bookings.model;

import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BookingListView(
    UUID id,
    UUID customerId,
    BookingStatus status,
    BookingType bookingType,
    LocalDate checkIn,
    LocalDate checkOut,
    int guestCount,
    OffsetDateTime holdExpiresAt,
    OffsetDateTime createdAt,
    String customerNotes,
    UUID propertyId,
    UUID roomId,
    String propertyTitle,
    String district,
    String roomName,
    int rentKrw,
    int serviceFeeKrw,
    int totalKrw,
    String pricingVersion) {}
