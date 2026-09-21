package com.housingplatform.features.profile.dto;

import com.housingplatform.persistence.enums.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProfileDto(
    UUID id,
    UserRole role,
    String fullName,
    String phone,
    String avatarUrl,
    String preferredLanguage,
    boolean marketingConsent,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt) {}
