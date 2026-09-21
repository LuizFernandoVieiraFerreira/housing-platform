package com.housingplatform.features.hosts.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterHostRequest(@NotBlank @Size(min = 1, max = 120) String displayName) {}
