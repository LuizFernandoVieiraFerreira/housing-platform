package com.housingplatform.admin.dto;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.HousingRequestStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HousingRequestDto(
    UUID id,
    String email,
    String desiredArea,
    LocalDate checkIn,
    LocalDate checkOut,
    Integer budgetMax,
    AccommodationType accommodationType,
    String notes,
    HousingRequestStatus status,
    OffsetDateTime createdAt) {}
