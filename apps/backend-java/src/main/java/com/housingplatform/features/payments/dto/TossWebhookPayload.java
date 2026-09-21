package com.housingplatform.features.payments.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TossWebhookPayload(
    String eventType, String createdAt, Map<String, Object> data) {}
