package com.housingplatform.features.admin.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminHost(
    UUID id,
    String displayName,
    String status,
    String profileName,
    OffsetDateTime verifiedAt,
    OffsetDateTime createdAt) {}
