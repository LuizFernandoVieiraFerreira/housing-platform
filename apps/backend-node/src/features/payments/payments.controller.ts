import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  AuthGuard,
  CurrentUser,
  Public,
  type AuthUser,
} from '@/shared/auth';

import type {
  ConfirmPaymentRequest,
  ConfirmPaymentResult,
  CreatePaymentOrderRequest,
  CreatePaymentOrderResult,
  TossWebhookPayload,
  WebhookAck,
} from './dto';
import { PaymentService } from './payment.service';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('orders')
  @HttpCode(HttpStatus.CREATED)
  createPaymentOrder(
    @CurrentUser() user: AuthUser,
    @Body() request: CreatePaymentOrderRequest,
  ): Promise<CreatePaymentOrderResult> {
    return this.paymentService.createPaymentOrder(user, request);
  }

  @Post('confirm')
  confirmPayment(
    @CurrentUser() user: AuthUser,
    @Body() request: ConfirmPaymentRequest,
  ): Promise<ConfirmPaymentResult> {
    return this.paymentService.confirmPayment(user, request);
  }

  @Public()
  @Post('webhook')
  receivePaymentWebhook(
    @Body() payload: TossWebhookPayload,
  ): Promise<WebhookAck> {
    return this.paymentService.receiveWebhook(payload);
  }
}
