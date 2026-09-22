package auth

import (
	"errors"
	"net/http"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
)

// Module bundles JWT validation, authorization, and HTTP middleware.
type Module struct {
	Validator     *JWTValidator
	Authorization *AuthorizationService
}

// Required returns middleware that requires a valid authenticated user.
func (m *Module) Required() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := m.authenticateRequest(r)
			if err != nil {
				writeAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(SetUser(r.Context(), user)))
		})
	}
}

// Optional returns middleware that attaches a user when a valid token is present.
func (m *Module) Optional() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := ExtractBearerToken(r)
			if token == "" {
				next.ServeHTTP(w, r)
				return
			}

			user, err := m.authenticateRequest(r)
			if err != nil {
				writeAuthError(w, err)
				return
			}

			next.ServeHTTP(w, r.WithContext(SetUser(r.Context(), user)))
		})
	}
}

// RequireAdmin returns middleware that requires an authenticated admin user.
func (m *Module) RequireAdmin() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return m.Required()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user := RequireUser(r.Context())
			if err := m.Authorization.RequireAdmin(r.Context(), user); err != nil {
				writeAuthError(w, err)
				return
			}
			next.ServeHTTP(w, r)
		}))
	}
}

func (m *Module) authenticateRequest(r *http.Request) (*User, error) {
	token := ExtractBearerToken(r)
	if token == "" {
		return nil, apierrors.Unauthorized("Authentication required")
	}

	claims, err := m.Validator.Validate(token)
	if err != nil {
		return nil, err
	}

	return m.Authorization.ResolveUser(r.Context(), claims.UserID, claims.Email)
}

func writeAuthError(w http.ResponseWriter, err error) {
	var appErr *apierrors.AppError
	if errors.As(err, &appErr) {
		apierrors.WriteError(w, appErr)
		return
	}

	apierrors.WriteError(w, apierrors.InternalError("An unexpected error occurred"))
}
