package errors

import (
	"context"
	"net/http"
)

type contextKey string

const errorKey contextKey = "appError"

// ErrorMiddleware is a chi middleware that handles panics and errors.
func ErrorMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				var appErr *AppError
				switch v := rec.(type) {
				case *AppError:
					appErr = v
				case error:
					appErr = InternalError(v.Error())
				case string:
					appErr = InternalError(v)
				default:
					appErr = InternalError("An unexpected error occurred")
				}
				WriteError(w, appErr)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

// SetError stores an error in the request context for later handling.
func SetError(ctx context.Context, err *AppError) context.Context {
	return context.WithValue(ctx, errorKey, err)
}

// GetError retrieves an error from the request context.
func GetError(ctx context.Context) *AppError {
	if err, ok := ctx.Value(errorKey).(*AppError); ok {
		return err
	}
	return nil
}
