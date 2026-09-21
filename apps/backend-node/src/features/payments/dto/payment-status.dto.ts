export enum PaymentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export enum WebhookAckStatus {
  Confirmed = 'confirmed',
  Failed = 'failed',
  Ignored = 'ignored',
  AlreadyConfirmed = 'already_confirmed',
}
