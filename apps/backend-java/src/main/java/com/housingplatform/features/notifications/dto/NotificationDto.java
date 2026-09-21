package com.housingplatform.features.notifications.dto;

import com.housingplatform.persistence.enums.NotificationType;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    UUID userId,
    NotificationType type,
    String title,
    String body,
    Map<String, Object> metadata,
    OffsetDateTime readAt,
    OffsetDateTime createdAt) {}
