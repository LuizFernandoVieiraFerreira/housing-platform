package com.housingplatform.features.notifications.dto;

import jakarta.validation.constraints.Min;

public record MarkAllNotificationsReadResult(@Min(0) int updatedCount) {}
