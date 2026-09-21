import { Module } from '@nestjs/common';

import { RateLimitService } from '@/shared/rate-limit/rate-limit.service';

import { PaymentFinalizationService } from './payment-finalization.service';
import { PaymentRepository } from './payment.repository';
import { PaymentService } from './payment.service';
import { PaymentsController } from './payments.controller';
import { TossClient } from './toss.client';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentRepository,
    PaymentFinalizationService,
    PaymentService,
    TossClient,
    RateLimitService,
  ],
})
export class PaymentsModule {}
