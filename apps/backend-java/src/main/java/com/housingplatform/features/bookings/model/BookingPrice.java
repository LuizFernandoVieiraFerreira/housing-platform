package com.housingplatform.features.bookings.model;

public record BookingPrice(
    int rentKrw, int serviceFeeKrw, int totalKrw, String pricingVersion) {}
