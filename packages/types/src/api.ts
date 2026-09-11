export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BOOKING_CONFLICT'
  | 'BOOKING_EXPIRED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiError;
}
