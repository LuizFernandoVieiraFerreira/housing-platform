package com.housingplatform.features.payments.dto;

public record WebhookAck(boolean ok, WebhookAckStatus status) {}
