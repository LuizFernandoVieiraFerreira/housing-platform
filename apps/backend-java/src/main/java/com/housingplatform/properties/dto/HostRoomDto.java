package com.housingplatform.properties.dto;

import com.housingplatform.persistence.enums.RoomStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record HostRoomDto(
    UUID id,
    String name,
    String roomType,
    BigDecimal sizeSqm,
    int maxOccupancy,
    int monthlyPriceKrw,
    RoomStatus status,
    LocalDate availableFrom) {}
