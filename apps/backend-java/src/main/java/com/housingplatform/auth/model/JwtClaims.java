package com.housingplatform.auth.model;

import java.util.UUID;

public record JwtClaims(UUID userId, String email) {}
