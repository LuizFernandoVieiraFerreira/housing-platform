package com.housingplatform.features.properties.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import java.util.List;
import java.util.UUID;

public record SearchPropertyCard(
    UUID id,
    String title,
    String slug,
    AccommodationType propertyType,
    String district,
    String nearestStationName,
    int monthlyPriceMin,
    String coverImageUrl,
    String coverImageAlt,
    List<String> tags,
    double latitude,
    double longitude,
    Double distanceMeters) {}
