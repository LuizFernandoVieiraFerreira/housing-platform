package com.housingplatform.hosts.dto;

import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HostBooking(
    UUID id,
    BookingStatus status,
    BookingType bookingType,
    LocalDate checkIn,
    LocalDate checkOut,
    @Min(1) int guestCount,
    String customerNotes,
    String propertyTitle,
    String roomName,
    @Min(0) int totalKrw,
    OffsetDateTime createdAt) {}
