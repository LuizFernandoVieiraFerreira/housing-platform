package com.housingplatform.features.properties.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import com.housingplatform.persistence.enums.PropertyStatus;
import java.util.List;
import java.util.UUID;

public record HostPropertyDetail(
    UUID id,
    String title,
    String slug,
    String description,
    AccommodationType propertyType,
    String addressLine1,
    String addressLine2,
    String city,
    String postalCode,
    String district,
    String nearestStationName,
    Integer nearestStationWalkMin,
    PropertyStatus status,
    BookingMode bookingMode,
    int minStayNights,
    List<String> tags,
    Double latitude,
    Double longitude,
    List<UUID> amenityIds,
    List<HostRoomDto> rooms) {}
