package com.housingplatform.features.bookings.dto;

import com.housingplatform.persistence.enums.BookingMode;
import jakarta.validation.constraints.Min;
import java.util.UUID;

public record BookingQuote(
    UUID roomId,
    UUID propertyId,
    BookingMode bookingMode,
    @Min(1) int nights,
    @Min(0) int rentKrw,
    @Min(0) int serviceFeeKrw,
    @Min(0) int totalKrw,
    String pricingVersion) {}
