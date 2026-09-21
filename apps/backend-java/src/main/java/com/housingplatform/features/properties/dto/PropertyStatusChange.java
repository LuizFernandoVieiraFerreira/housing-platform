package com.housingplatform.features.properties.dto;

import com.housingplatform.persistence.enums.PropertyStatus;
import java.util.UUID;

public record PropertyStatusChange(UUID id, PropertyStatus status) {}
