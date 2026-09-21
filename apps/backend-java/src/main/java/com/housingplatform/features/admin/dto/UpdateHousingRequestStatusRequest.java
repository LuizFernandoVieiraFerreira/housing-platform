package com.housingplatform.features.admin.dto;

import com.housingplatform.persistence.enums.HousingRequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateHousingRequestStatusRequest(@NotNull HousingRequestStatus status) {}
