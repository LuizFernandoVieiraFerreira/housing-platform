export interface AppErrorDetails {
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details: AppErrorDetails;

  constructor(options: {
    code: string;
    message: string;
    statusCode: number;
    details?: AppErrorDetails;
  }) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details ?? {};
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super({
      code: 'UNAUTHENTICATED',
      message,
      statusCode: 401,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super({
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({
      code: 'NOT_FOUND',
      message,
      statusCode: 404,
    });
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: AppErrorDetails) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      details,
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Request conflicts with current state') {
    super({
      code: 'BOOKING_CONFLICT',
      message,
      statusCode: 409,
    });
  }
}

export class BookingExpiredError extends AppError {
  constructor(message = 'Booking hold has expired') {
    super({
      code: 'BOOKING_EXPIRED',
      message,
      statusCode: 409,
    });
  }
}

export class PaymentFailedError extends AppError {
  constructor(message = 'Payment was not completed') {
    super({
      code: 'PAYMENT_FAILED',
      message,
      statusCode: 409,
    });
  }
}

export class PaymentAmountMismatchError extends AppError {
  constructor(message = 'Payment amount does not match booking total') {
    super({
      code: 'PAYMENT_AMOUNT_MISMATCH',
      message,
      statusCode: 409,
    });
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service error') {
    super({
      code: 'EXTERNAL_SERVICE_ERROR',
      message,
      statusCode: 502,
    });
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super({
      code: 'RATE_LIMITED',
      message,
      statusCode: 429,
    });
  }
}
