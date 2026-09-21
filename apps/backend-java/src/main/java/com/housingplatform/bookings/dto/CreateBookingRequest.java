package com.housingplatform.bookings.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBookingRequest(
    @NotNull UUID roomId,
    @NotNull LocalDate checkIn,
    @NotNull LocalDate checkOut,
    @Min(1) @Max(20) int guestCount,
    @Size(max = 500) String customerNotes) {}
