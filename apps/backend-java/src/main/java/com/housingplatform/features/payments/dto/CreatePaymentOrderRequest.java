package com.housingplatform.features.payments.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreatePaymentOrderRequest(@NotNull UUID bookingId) {}
