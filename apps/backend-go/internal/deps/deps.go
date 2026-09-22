package deps

import (
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/auth"
	"github.com/housing-platform/backend-go/internal/config"
)

// Deps bundles shared dependencies for HTTP handlers and services.
type Deps struct {
	Pool   *pgxpool.Pool
	Config *config.Config
	Auth   *auth.Module
}
