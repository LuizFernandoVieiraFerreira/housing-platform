package com.housingplatform.features.properties.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRoomRequest(
    @NotBlank @Size(min = 1, max = 120) String name,
    @Size(max = 80) String roomType,
    @DecimalMin(value = "0", inclusive = false) @DecimalMax("500") BigDecimal sizeSqm,
    @Min(1) @Max(20) int maxOccupancy,
    @Min(100000) int monthlyPriceKrw,
    LocalDate availableFrom) {}
