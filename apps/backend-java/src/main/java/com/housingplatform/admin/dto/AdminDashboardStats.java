package com.housingplatform.admin.dto;

import jakarta.validation.constraints.Min;

public record AdminDashboardStats(
    @Min(0) int pendingProperties,
    @Min(0) int pendingHosts,
    @Min(0) int openBookings,
    @Min(0) int openHousingRequests) {}
