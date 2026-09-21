package com.housingplatform.features.notifications.dto;

import jakarta.validation.constraints.Min;

public record UnreadNotificationCount(@Min(0) int count) {}
