package com.housingplatform.features.properties.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record HostPropertyRequest(
    @NotBlank @Size(min = 1, max = 160) String title,
    @NotBlank @Size(min = 20, max = 5000) String description,
    @NotNull AccommodationType propertyType,
    @NotBlank @Size(min = 1, max = 200) String addressLine1,
    @Size(max = 200) String addressLine2,
    @NotBlank @Size(min = 1, max = 80) String city,
    @Size(max = 20) String postalCode,
    @NotBlank @Size(min = 1, max = 80) String district,
    @Size(max = 120) String nearestStationName,
    @Min(1) @Max(120) Integer nearestStationWalkMin,
    @NotNull BookingMode bookingMode,
    @Min(1) @Max(365) int minStayNights,
    @Size(max = 20) List<@NotBlank String> tags,
    List<UUID> amenityIds,
    @Min(-90) @Max(90) Double latitude,
    @Min(-180) @Max(180) Double longitude) {}
