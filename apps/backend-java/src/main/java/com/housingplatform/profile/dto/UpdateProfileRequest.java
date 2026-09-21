package com.housingplatform.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank @Size(min = 1, max = 120) String fullName,
    @Size(max = 30) String phone,
    @NotBlank @Size(min = 2, max = 10) String preferredLanguage,
    @NotNull Boolean marketingConsent,
    String avatarUrl) {}
