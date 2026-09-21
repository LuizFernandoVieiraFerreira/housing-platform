package com.housingplatform.features.admin.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import com.housingplatform.persistence.enums.PropertyStatus;
import jakarta.validation.constraints.Min;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminProperty(
    UUID id,
    String title,
    String slug,
    AccommodationType propertyType,
    String district,
    PropertyStatus status,
    BookingMode bookingMode,
    Integer monthlyPriceMin,
    @Min(0) int roomCount,
    OffsetDateTime updatedAt,
    String hostDisplayName) {}
