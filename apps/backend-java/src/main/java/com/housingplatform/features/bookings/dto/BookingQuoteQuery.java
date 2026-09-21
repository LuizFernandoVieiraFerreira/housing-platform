package com.housingplatform.features.bookings.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record BookingQuoteQuery(
    @NotNull UUID roomId,
    @NotNull LocalDate checkIn,
    @NotNull LocalDate checkOut,
    @Min(1) @Max(20) int guestCount) {}
