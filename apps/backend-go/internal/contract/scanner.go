package contract

import (
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/housing-platform/backend-go/internal/api"
	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/deps"
)

// ScanChiOperations walks a chi router and returns normalized operations under apiPrefix.
func ScanChiOperations(router chi.Routes, apiPrefix string) (map[OperationKey]string, error) {
	operations := make(map[OperationKey]string)

	err := chi.Walk(router, func(method, route string, _ http.Handler, _ ...func(http.Handler) http.Handler) error {
		if !strings.HasPrefix(route, apiPrefix) {
			return nil
		}

		key := OperationKey{
			NormalizedPath: NormalizePath(route),
			Method:         strings.ToLower(method),
		}
		operations[key] = route
		return nil
	})
	if err != nil {
		return nil, err
	}

	return operations, nil
}

// ScanAppOperations walks the application router using test auth dependencies.
func ScanAppOperations(authModule *auth.Module) (map[OperationKey]string, error) {
	router := api.NewRouter(&deps.Deps{
		Config: &config.Config{
			APIPrefix:   APIPrefix,
			CORSOrigins: []string{"http://localhost:5173"},
		},
		Auth: authModule,
		Pool: nil,
	})

	return ScanChiOperations(router, APIPrefix)
}
