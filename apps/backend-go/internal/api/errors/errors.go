package errors

import (
	"encoding/json"
	"errors"
	"net/http"
)

// Standard error codes matching the OpenAPI contract.
const (
	CodeBadRequest          = "BAD_REQUEST"
	CodeUnauthorized        = "UNAUTHORIZED"
	CodeForbidden           = "FORBIDDEN"
	CodeNotFound            = "NOT_FOUND"
	CodeConflict            = "CONFLICT"
	CodeUnprocessableEntity = "UNPROCESSABLE_ENTITY"
	CodeInternalError       = "INTERNAL_ERROR"
	CodeServiceUnavailable  = "SERVICE_UNAVAILABLE"
)

// AppError represents a structured application error.
type AppError struct {
	Code    string         `json:"code"`
	Message string         `json:"message"`
	Details map[string]any `json:"details,omitempty"`
	status  int
}

// Error implements the error interface.
func (e *AppError) Error() string {
	return e.Message
}

// StatusCode returns the HTTP status code for this error.
func (e *AppError) StatusCode() int {
	return e.status
}

// ErrorResponse is the standard error response envelope.
type ErrorResponse struct {
	Error *AppError `json:"error"`
}

// New creates a new AppError.
func New(code string, message string, status int) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		status:  status,
	}
}

// WithDetails adds details to the error.
func (e *AppError) WithDetails(details map[string]any) *AppError {
	e.Details = details
	return e
}

// Common error constructors.

func BadRequest(message string) *AppError {
	return New(CodeBadRequest, message, http.StatusBadRequest)
}

func Unauthorized(message string) *AppError {
	return New(CodeUnauthorized, message, http.StatusUnauthorized)
}

func Forbidden(message string) *AppError {
	return New(CodeForbidden, message, http.StatusForbidden)
}

func NotFound(message string) *AppError {
	return New(CodeNotFound, message, http.StatusNotFound)
}

func Conflict(message string) *AppError {
	return New(CodeConflict, message, http.StatusConflict)
}

func UnprocessableEntity(message string) *AppError {
	return New(CodeUnprocessableEntity, message, http.StatusUnprocessableEntity)
}

func InternalError(message string) *AppError {
	return New(CodeInternalError, message, http.StatusInternalServerError)
}

func ServiceUnavailable(message string) *AppError {
	return New(CodeServiceUnavailable, message, http.StatusServiceUnavailable)
}

// WriteError writes an AppError as JSON to the response writer.
func WriteError(w http.ResponseWriter, err *AppError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(err.StatusCode())
	json.NewEncoder(w).Encode(ErrorResponse{Error: err})
}

// FromError converts a standard error to an AppError.
// If the error is already an AppError, it returns it directly.
// Otherwise, it wraps it as an internal error.
func FromError(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return InternalError("An unexpected error occurred")
}
