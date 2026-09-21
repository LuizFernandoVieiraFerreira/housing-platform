import type { WebhookAckStatus } from './payment-status.dto';

export interface TossWebhookPayload {
  eventType?: string | null;
  createdAt?: string | null;
  data?: Record<string, unknown> | null;
}

export interface WebhookAck {
  ok: boolean;
  status: WebhookAckStatus;
}
