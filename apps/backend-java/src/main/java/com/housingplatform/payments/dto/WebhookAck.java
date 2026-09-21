package com.housingplatform.payments.dto;

public record WebhookAck(boolean ok, WebhookAckStatus status) {}
