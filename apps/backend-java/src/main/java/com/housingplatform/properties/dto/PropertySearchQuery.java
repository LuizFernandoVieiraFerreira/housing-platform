package com.housingplatform.properties.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PropertySearchQuery(
    String query,
    AccommodationType propertyType,
    LocalDate checkIn,
    LocalDate checkOut,
    @Min(1) @Max(20) Integer guests,
    @Min(0) Integer priceMin,
    @Min(0) Integer priceMax,
    PropertySearchSort sort,
    @Min(-90) @Max(90) Double centerLat,
    @Min(-180) @Max(180) Double centerLng,
    @Min(-90) @Max(90) Double north,
    @Min(-90) @Max(90) Double south,
    @Min(-180) @Max(180) Double east,
    @Min(-180) @Max(180) Double west,
    List<String> amenitySlugs,
    @Min(1) @Max(120) Integer maxStationWalkMin,
    List<UUID> excludePropertyIds,
    @Min(1) @Max(100) Integer limit,
    @Min(0) Integer offset) {

  public PropertySearchQuery {
    if (sort == null) {
      sort = PropertySearchSort.recommended;
    }
    if (limit == null) {
      limit = 20;
    }
    if (offset == null) {
      offset = 0;
    }
  }
}
