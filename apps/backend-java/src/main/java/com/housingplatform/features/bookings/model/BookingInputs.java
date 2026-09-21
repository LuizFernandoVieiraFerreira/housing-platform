package com.housingplatform.features.bookings.model;

import java.util.UUID;

public record BookingInputs(
    UUID roomId,
    UUID propertyId,
    String bookingMode,
    int minStayNights,
    int monthlyPriceKrw,
    int maxOccupancy,
    int nights) {}
