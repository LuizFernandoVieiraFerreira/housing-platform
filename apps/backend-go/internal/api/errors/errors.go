package errors

import (
	"encoding/json"
	"errors"
	"net/http"
)

// Standard error codes matching the OpenAPI contract.
const (
	CodeValidationError        = "VALIDATION_ERROR"
	CodeUnauthenticated        = "UNAUTHENTICATED"
	CodeForbidden              = "FORBIDDEN"
	CodeNotFound               = "NOT_FOUND"
	CodeBookingConflict        = "BOOKING_CONFLICT"
	CodeBookingExpired         = "BOOKING_EXPIRED"
	CodePaymentFailed          = "PAYMENT_FAILED"
	CodePaymentAmountMismatch  = "PAYMENT_AMOUNT_MISMATCH"
	CodeExternalServiceError   = "EXTERNAL_SERVICE_ERROR"
	CodeRateLimited            = "RATE_LIMITED"
	CodeInternalError          = "INTERNAL_ERROR"
)

// AppError represents a structured application error.
type AppError struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
	status  int
}

func (e *AppError) Error() string {
	return e.Message
}

func (e *AppError) StatusCode() int {
	return e.status
}

type ErrorResponse struct {
	Error *AppError `json:"error"`
}

func New(code string, message string, status int) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		status:  status,
	}
}

func (e *AppError) WithDetails(details map[string]any) *AppError {
	e.Details = details
	return e
}

func BadRequest(message string) *AppError {
	return New(CodeValidationError, message, http.StatusBadRequest)
}

func Unauthorized(message string) *AppError {
	return New(CodeUnauthenticated, message, http.StatusUnauthorized)
}

func Forbidden(message string) *AppError {
	return New(CodeForbidden, message, http.StatusForbidden)
}

func NotFound(message string) *AppError {
	return New(CodeNotFound, message, http.StatusNotFound)
}

func Conflict(message string) *AppError {
	return New(CodeBookingConflict, message, http.StatusConflict)
}

func BookingExpired(message string) *AppError {
	return New(CodeBookingExpired, message, http.StatusConflict)
}

func PaymentFailed(message string) *AppError {
	return New(CodePaymentFailed, message, http.StatusConflict)
}

func PaymentAmountMismatch(message string) *AppError {
	return New(CodePaymentAmountMismatch, message, http.StatusConflict)
}

func ExternalServiceError(message string) *AppError {
	return New(CodeExternalServiceError, message, http.StatusBadGateway)
}

func RateLimited(message string) *AppError {
	return New(CodeRateLimited, message, http.StatusTooManyRequests)
}

func InternalError(message string) *AppError {
	return New(CodeInternalError, message, http.StatusInternalServerError)
}

func WriteError(w http.ResponseWriter, err *AppError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.StatusCode())
	_ = json.NewEncoder(w).Encode(ErrorResponse{Error: err})
}

func FromError(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return InternalError("An unexpected error occurred")
}
