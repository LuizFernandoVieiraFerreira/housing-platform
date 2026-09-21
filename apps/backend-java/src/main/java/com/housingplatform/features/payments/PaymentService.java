package com.housingplatform.features.payments;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.shared.auth.error.ExternalServiceException;
import com.housingplatform.shared.auth.error.ForbiddenException;
import com.housingplatform.shared.auth.error.NotFoundException;
import com.housingplatform.shared.auth.error.PaymentAmountMismatchException;
import com.housingplatform.shared.auth.error.PaymentFailedException;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.persistence.repository.PaymentRepository;
import com.housingplatform.features.payments.dto.ConfirmPaymentRequest;
import com.housingplatform.features.payments.dto.ConfirmPaymentResult;
import com.housingplatform.features.payments.dto.CreatePaymentOrderRequest;
import com.housingplatform.features.payments.dto.CreatePaymentOrderResult;
import com.housingplatform.features.payments.dto.TossWebhookPayload;
import com.housingplatform.features.payments.dto.WebhookAck;
import com.housingplatform.features.payments.dto.WebhookAckStatus;
import com.housingplatform.features.payments.mapper.PaymentMapper;
import com.housingplatform.persistence.enums.PaymentStatus;
import com.housingplatform.shared.RateLimitService;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {

  private final PaymentRepository paymentRepository;
  private final PaymentFinalizationService paymentFinalizationService;
  private final RateLimitService rateLimitService;
  private final TossClient tossClient;

  public PaymentService(
      PaymentRepository paymentRepository,
      PaymentFinalizationService paymentFinalizationService,
      RateLimitService rateLimitService,
      TossClient tossClient) {
    this.paymentRepository = paymentRepository;
    this.paymentFinalizationService = paymentFinalizationService;
    this.rateLimitService = rateLimitService;
    this.tossClient = tossClient;
  }

  @Transactional
  public CreatePaymentOrderResult createPaymentOrder(
      AuthenticatedUser user, CreatePaymentOrderRequest request) {
    rateLimitService.assertRateLimit("create-payment:" + user.id(), 20, 60);
    var order = paymentRepository.createPaymentOrder(request.bookingId(), user.id());
    return PaymentMapper.toCreateOrderResult(
        order.paymentId(), order.orderId(), order.bookingId(), order.amountKrw(), order.orderName());
  }

  @Transactional
  public ConfirmPaymentResult confirmPayment(AuthenticatedUser user, ConfirmPaymentRequest request) {
    rateLimitService.assertRateLimit("confirm-payment:" + user.id(), 20, 60);

    var payment =
        paymentRepository
            .findByOrderId(request.orderId())
            .orElseThrow(() -> new NotFoundException("Payment not found"));

    if (!payment.customerId().equals(user.id())) {
      throw new ForbiddenException("You cannot confirm this payment");
    }
    if (payment.amountKrw() != request.amount()) {
      throw new PaymentAmountMismatchException("Payment amount does not match booking total");
    }
    if (payment.status() == PaymentStatus.confirmed) {
      return PaymentMapper.toConfirmResult(
          payment.id(), payment.orderId(), null, PaymentStatus.confirmed);
    }

    Map<String, Object> tossResponse = null;
    try {
      tossResponse =
          tossClient.confirmPayment(
              request.paymentKey(), request.orderId().toString(), request.amount());
    } catch (TossClient.TossClientError exception) {
      paymentFinalizationService.markPaymentFailed(
          request.orderId(), exception.getMessage(), tossResponse);
      throw new PaymentFailedException(exception.getMessage());
    }

    if (!TossClient.isSuccessful(tossResponse)) {
      String reason = String.valueOf(tossResponse.getOrDefault("status", "Payment not completed"));
      paymentFinalizationService.markPaymentFailed(request.orderId(), reason, tossResponse);
      throw new PaymentFailedException("Payment was not completed");
    }

    var finalized =
        paymentFinalizationService.finalizeSuccessfulPayment(
            request.orderId(), request.paymentKey(), request.amount(), tossResponse);
    return PaymentMapper.toConfirmResult(finalized);
  }

  @Transactional
  public WebhookAck receiveWebhook(TossWebhookPayload payload) {
    if (tossClient.isDevMockEnabled() && !tossClient.hasSecretKey()) {
      return new WebhookAck(true, WebhookAckStatus.ignored);
    }

    Map<String, Object> data = payload.data() == null ? Map.of() : payload.data();
    String paymentKey = String.valueOf(data.getOrDefault("paymentKey", ""));
    String orderIdRaw = String.valueOf(data.getOrDefault("orderId", ""));

    if (paymentKey.isBlank() || orderIdRaw.isBlank()) {
      throw new BadRequestException("Webhook payload missing paymentKey or orderId");
    }

    UUID orderId;
    try {
      orderId = UUID.fromString(orderIdRaw);
    } catch (IllegalArgumentException exception) {
      throw new BadRequestException("Webhook payload missing paymentKey or orderId");
    }

    String eventId =
        (payload.eventType() == null ? "UNKNOWN" : payload.eventType())
            + ":"
            + paymentKey
            + ":"
            + (payload.createdAt() == null ? "unknown" : payload.createdAt());

    var payment =
        paymentRepository
            .findByOrderId(orderId)
            .orElseThrow(() -> new NotFoundException("Payment not found"));

    paymentFinalizationService.recordPaymentEvent(
        eventId,
        payment.id(),
        payment.bookingId(),
        payload.eventType() == null ? "UNKNOWN" : payload.eventType(),
        Map.of(
            "eventType", payload.eventType(),
            "createdAt", payload.createdAt(),
            "data", data));

    if (payment.status() == PaymentStatus.confirmed) {
      return new WebhookAck(true, WebhookAckStatus.already_confirmed);
    }

    Map<String, Object> tossPayment;
    try {
      tossPayment = tossClient.fetchPayment(paymentKey);
    } catch (TossClient.TossClientError exception) {
      throw new ExternalServiceException(exception.getMessage());
    }

    if (TossClient.isSuccessful(tossPayment)) {
      int amount = ((Number) tossPayment.getOrDefault("totalAmount", payment.amountKrw())).intValue();
      paymentFinalizationService.finalizeSuccessfulPayment(
          orderId, paymentKey, amount, tossPayment);
      return new WebhookAck(true, WebhookAckStatus.confirmed);
    }

    if (TossClient.isFailed(tossPayment)) {
      paymentFinalizationService.markPaymentFailed(
          orderId, String.valueOf(tossPayment.getOrDefault("status", "Payment failed")), tossPayment);
      return new WebhookAck(true, WebhookAckStatus.failed);
    }

    return new WebhookAck(true, WebhookAckStatus.ignored);
  }
}
