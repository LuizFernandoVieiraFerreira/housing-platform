import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfiguration } from '@/config/configuration';

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

export class TossClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TossClientError';
  }
}

export type TossPaymentPayload = Record<string, unknown>;

@Injectable()
export class TossClient {
  private readonly secretKey: string;
  private readonly paymentDevMock: boolean;

  constructor(
    private readonly configService: ConfigService<AppConfiguration, true>,
  ) {
    this.secretKey = this.configService.get('tossSecretKey', { infer: true });
    this.paymentDevMock = this.configService.get('paymentDevMock', { infer: true });
  }

  isDevMockEnabled(): boolean {
    return this.paymentDevMock || this.secretKey.length === 0;
  }

  hasSecretKey(): boolean {
    return this.secretKey.length > 0;
  }

  async confirmPayment(input: {
    paymentKey: string;
    orderId: string;
    amount: number;
  }): Promise<TossPaymentPayload> {
    if (this.isDevMockEnabled() && input.paymentKey.startsWith('devmock_')) {
      return {
        status: 'DONE',
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        totalAmount: input.amount,
        method: 'DEV_MOCK',
      };
    }

    const response = await fetch(`${TOSS_API_BASE}/payments/confirm`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        amount: input.amount,
      }),
    });

    const payload = (await response.json()) as TossPaymentPayload;
    if (!response.ok) {
      const message =
        typeof payload.message === 'string'
          ? payload.message
          : 'Toss payment confirmation failed';
      throw new TossClientError(message);
    }

    return payload;
  }

  async fetchPayment(paymentKey: string): Promise<TossPaymentPayload> {
    const response = await fetch(`${TOSS_API_BASE}/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader(),
      },
    });

    const payload = (await response.json()) as TossPaymentPayload;
    if (!response.ok) {
      const message =
        typeof payload.message === 'string'
          ? payload.message
          : 'Unable to fetch Toss payment';
      throw new TossClientError(message);
    }

    return payload;
  }

  static isSuccessful(payload: TossPaymentPayload): boolean {
    return payload.status === 'DONE';
  }

  static isFailed(payload: TossPaymentPayload): boolean {
    const status = payload.status;
    return status === 'ABORTED' || status === 'CANCELED' || status === 'EXPIRED';
  }

  private authHeader(): string {
    if (!this.secretKey) {
      throw new TossClientError('TOSS_SECRET_KEY is not configured');
    }

    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }
}
