package com.housingplatform.shared.auth.model;

import java.util.UUID;

public record JwtClaims(UUID userId, String email) {}
