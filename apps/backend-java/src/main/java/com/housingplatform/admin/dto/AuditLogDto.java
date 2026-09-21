package com.housingplatform.admin.dto;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record AuditLogDto(
    UUID id,
    String action,
    String entityType,
    UUID entityId,
    String actorName,
    Map<String, Object> metadata,
    OffsetDateTime createdAt) {}
