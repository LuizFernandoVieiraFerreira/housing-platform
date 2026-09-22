package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config holds all application configuration.
type Config struct {
	Port                int
	APIPrefix           string
	CORSOrigins         []string
	DatabaseURL         string
	SupabaseURL         string
	SupabaseJWTSecret   string
	SupabaseJWTAudience string
	TossSecretKey       string
	PaymentDevMock      bool
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	port := 3001
	if v := os.Getenv("PORT"); v != "" {
		p, err := strconv.Atoi(v)
		if err != nil {
			return nil, fmt.Errorf("invalid PORT: %w", err)
		}
		port = p
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
	}

	corsOrigins := parseCORSOrigins(os.Getenv("CORS_ORIGINS"))

	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		supabaseURL = "http://127.0.0.1:54321"
	}

	supabaseJWTAudience := os.Getenv("SUPABASE_JWT_AUDIENCE")
	if supabaseJWTAudience == "" {
		supabaseJWTAudience = "authenticated"
	}

	return &Config{
		Port:                port,
		APIPrefix:           "/api/v1",
		CORSOrigins:         corsOrigins,
		DatabaseURL:         databaseURL,
		SupabaseURL:         supabaseURL,
		SupabaseJWTSecret:   os.Getenv("SUPABASE_JWT_SECRET"),
		SupabaseJWTAudience: supabaseJWTAudience,
		TossSecretKey:       os.Getenv("TOSS_SECRET_KEY"),
		PaymentDevMock:      os.Getenv("PAYMENT_DEV_MOCK") == "true",
	}, nil
}

func parseCORSOrigins(value string) []string {
	if value == "" {
		return []string{"http://localhost:5173"}
	}

	value = strings.TrimSpace(value)
	if strings.HasPrefix(value, "[") {
		// JSON array format not supported in this simple parser
		// Fall back to comma-separated
		value = strings.Trim(value, "[]")
	}

	var origins []string
	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		origin = strings.Trim(origin, `"'`)
		if origin != "" {
			origins = append(origins, origin)
		}
	}

	if len(origins) == 0 {
		return []string{"http://localhost:5173"}
	}

	return origins
}
