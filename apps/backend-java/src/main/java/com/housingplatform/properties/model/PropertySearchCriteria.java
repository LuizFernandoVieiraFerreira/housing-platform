package com.housingplatform.properties.model;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.properties.dto.PropertySearchSort;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PropertySearchCriteria(
    String textQuery,
    AccommodationType propertyType,
    Integer priceMin,
    Integer priceMax,
    Integer guests,
    Integer stayNights,
    LocalDate checkIn,
    PropertySearchSort sort,
    Double centerLat,
    Double centerLng,
    Double north,
    Double south,
    Double east,
    Double west,
    boolean hasBounds,
    Integer maxStationWalkMin,
    List<String> amenitySlugs,
    List<UUID> excludePropertyIds) {}
