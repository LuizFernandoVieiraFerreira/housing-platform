package com.housingplatform.properties.dto;

import java.util.UUID;

public record PropertyImageDto(
    UUID id,
    String storagePath,
    String url,
    String altText,
    int sortOrder,
    boolean isCover) {}
