package com.housingplatform.payments;

import com.housingplatform.auth.AuthSupport;
import com.housingplatform.payments.dto.ConfirmPaymentRequest;
import com.housingplatform.payments.dto.ConfirmPaymentResult;
import com.housingplatform.payments.dto.CreatePaymentOrderRequest;
import com.housingplatform.payments.dto.CreatePaymentOrderResult;
import com.housingplatform.payments.dto.TossWebhookPayload;
import com.housingplatform.payments.dto.WebhookAck;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/payments")
public class PaymentController {

  private final PaymentService paymentService;

  public PaymentController(PaymentService paymentService) {
    this.paymentService = paymentService;
  }

  @PostMapping("/orders")
  @ResponseStatus(HttpStatus.CREATED)
  public CreatePaymentOrderResult createPaymentOrder(
      @Valid @RequestBody CreatePaymentOrderRequest request) {
    return paymentService.createPaymentOrder(AuthSupport.requireCurrentUser(), request);
  }

  @PostMapping("/confirm")
  public ConfirmPaymentResult confirmPayment(@Valid @RequestBody ConfirmPaymentRequest request) {
    return paymentService.confirmPayment(AuthSupport.requireCurrentUser(), request);
  }

  @PostMapping("/webhook")
  public WebhookAck receivePaymentWebhook(@RequestBody TossWebhookPayload payload) {
    return paymentService.receiveWebhook(payload);
  }
}
