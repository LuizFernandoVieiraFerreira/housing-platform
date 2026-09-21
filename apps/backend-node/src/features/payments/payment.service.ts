import { Injectable } from '@nestjs/common';

import type { AuthUser } from '@/shared/auth/auth-user.model';
import {
  BadRequestError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  PaymentAmountMismatchError,
  PaymentFailedError,
} from '@/shared/errors';
import { RateLimitService } from '@/shared/rate-limit/rate-limit.service';

import type {
  ConfirmPaymentRequest,
  ConfirmPaymentResult,
  CreatePaymentOrderRequest,
  CreatePaymentOrderResult,
  TossWebhookPayload,
  WebhookAck,
} from './dto';
import { PaymentStatus, WebhookAckStatus } from './dto';
import {
  mapConfirmPaymentResult,
  mapCreatePaymentOrderResult,
} from './mappers/payment.mapper';
import { PaymentFinalizationService } from './payment-finalization.service';
import { PaymentRepository } from './payment.repository';
import { TossClient, TossClientError } from './toss.client';

@Injectable()
export class PaymentService {
  constructor(
    private readonly repository: PaymentRepository,
    private readonly tossClient: TossClient,
    private readonly finalization: PaymentFinalizationService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async createPaymentOrder(
    user: AuthUser,
    request: CreatePaymentOrderRequest,
  ): Promise<CreatePaymentOrderResult> {
    await this.rateLimit.assertRateLimit(`create-payment:${user.id}`, 20, 60);

    const order = await this.repository.createPaymentOrder(
      request.bookingId,
      user.id,
    );

    return mapCreatePaymentOrderResult({
      paymentId: order.paymentId,
      orderId: order.orderId,
      bookingId: order.bookingId,
      amountKrw: order.amountKrw,
      orderName: order.orderName,
    });
  }

  async confirmPayment(
    user: AuthUser,
    request: ConfirmPaymentRequest,
  ): Promise<ConfirmPaymentResult> {
    await this.rateLimit.assertRateLimit(`confirm-payment:${user.id}`, 20, 60);

    const payment = await this.repository.getPaymentByOrderId(request.orderId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.customerId !== user.id) {
      throw new ForbiddenError('You cannot confirm this payment');
    }

    if (payment.amountKrw !== request.amount) {
      throw new PaymentAmountMismatchError();
    }

    if (payment.status === 'confirmed') {
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        bookingId: null,
        status: PaymentStatus.Confirmed,
      };
    }

    let tossResponse: Record<string, unknown> | null = null;

    try {
      tossResponse = await this.tossClient.confirmPayment({
        paymentKey: request.paymentKey,
        orderId: request.orderId,
        amount: request.amount,
      });
    } catch (error) {
      if (error instanceof TossClientError) {
        await this.finalization.markPaymentFailed({
          orderId: request.orderId,
          reason: error.message,
          tossResponse,
        });
        throw new PaymentFailedError(error.message);
      }
      throw error;
    }

    if (!TossClient.isSuccessful(tossResponse)) {
      const reason = String(tossResponse.status ?? 'Payment not completed');
      await this.finalization.markPaymentFailed({
        orderId: request.orderId,
        reason,
        tossResponse,
      });
      throw new PaymentFailedError('Payment was not completed');
    }

    const finalized = await this.finalization.finalizeSuccessfulPayment({
      orderId: request.orderId,
      paymentKey: request.paymentKey,
      amountKrw: request.amount,
      tossResponse,
    });

    return mapConfirmPaymentResult(finalized);
  }

  async receiveWebhook(payload: TossWebhookPayload): Promise<WebhookAck> {
    if (this.tossClient.isDevMockEnabled() && !this.tossClient.hasSecretKey()) {
      return { ok: true, status: WebhookAckStatus.Ignored };
    }

    const data = payload.data ?? {};
    const paymentKey = String(data.paymentKey ?? '');
    const orderIdRaw = String(data.orderId ?? '');

    if (!paymentKey || !orderIdRaw) {
      throw new BadRequestError('Webhook payload missing paymentKey or orderId');
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderIdRaw)) {
      throw new BadRequestError('Webhook payload missing paymentKey or orderId');
    }

    const eventId = `${payload.eventType ?? 'UNKNOWN'}:${paymentKey}:${payload.createdAt ?? 'unknown'}`;

    const payment = await this.repository.getPaymentByOrderId(orderIdRaw);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    await this.finalization.recordPaymentEvent({
      eventId,
      paymentId: payment.id,
      bookingId: payment.bookingId,
      eventType: payload.eventType ?? 'UNKNOWN',
      payload: payload as Record<string, unknown>,
    });

    if (payment.status === 'confirmed') {
      return { ok: true, status: WebhookAckStatus.AlreadyConfirmed };
    }

    let tossPayment: Record<string, unknown>;
    try {
      tossPayment = await this.tossClient.fetchPayment(paymentKey);
    } catch (error) {
      if (error instanceof TossClientError) {
        throw new ExternalServiceError(error.message);
      }
      throw error;
    }

    if (TossClient.isSuccessful(tossPayment)) {
      const amount = Number(tossPayment.totalAmount ?? payment.amountKrw);
      await this.finalization.finalizeSuccessfulPayment({
        orderId: orderIdRaw,
        paymentKey,
        amountKrw: amount,
        tossResponse: tossPayment,
      });
      return { ok: true, status: WebhookAckStatus.Confirmed };
    }

    if (TossClient.isFailed(tossPayment)) {
      await this.finalization.markPaymentFailed({
        orderId: orderIdRaw,
        reason: String(tossPayment.status ?? 'Payment failed'),
        tossResponse: tossPayment,
      });
      return { ok: true, status: WebhookAckStatus.Failed };
    }

    return { ok: true, status: WebhookAckStatus.Ignored };
  }
}
