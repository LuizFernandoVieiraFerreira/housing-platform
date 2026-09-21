from typing import Any


class AppError(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class UnauthenticatedError(AppError):
    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(code="UNAUTHENTICATED", message=message, status_code=401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(code="FORBIDDEN", message=message, status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class BadRequestError(AppError):
    def __init__(
        self,
        message: str = "Bad request",
        *,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=400, details=details)


class ConflictError(AppError):
    def __init__(self, message: str = "Request conflicts with current state") -> None:
        super().__init__(code="BOOKING_CONFLICT", message=message, status_code=409)


class RateLimitedError(AppError):
    def __init__(self, message: str = "Rate limit exceeded") -> None:
        super().__init__(code="RATE_LIMITED", message=message, status_code=429)
