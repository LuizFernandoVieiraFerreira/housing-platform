package com.housingplatform.features.hosts.dto;

import com.housingplatform.persistence.enums.HostStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record HostDto(
    UUID id,
    UUID profileId,
    String displayName,
    HostStatus status,
    OffsetDateTime verifiedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
