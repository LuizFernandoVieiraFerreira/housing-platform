package com.housingplatform.features.properties.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import java.util.List;
import java.util.UUID;

public record PropertyDetail(
    UUID id,
    String title,
    String slug,
    String description,
    AccommodationType propertyType,
    String district,
    String nearestStationName,
    Integer nearestStationWalkMin,
    String addressLine1,
    String addressLine2,
    String city,
    BookingMode bookingMode,
    int minStayNights,
    int monthlyPriceMin,
    List<String> tags,
    String hostDisplayName,
    Double latitude,
    Double longitude,
    List<PropertyImageDto> images,
    List<PropertyRoomDto> rooms,
    List<PropertyAmenityDto> amenities) {}
