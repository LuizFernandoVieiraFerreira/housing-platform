package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	// Clear environment
	os.Unsetenv("PORT")
	os.Unsetenv("DATABASE_URL")
	os.Unsetenv("CORS_ORIGINS")
	os.Unsetenv("SUPABASE_URL")
	os.Unsetenv("SUPABASE_JWT_SECRET")
	os.Unsetenv("SUPABASE_JWT_AUDIENCE")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != 3001 {
		t.Errorf("expected port 3001, got %d", cfg.Port)
	}

	if cfg.APIPrefix != "/api/v1" {
		t.Errorf("expected API prefix /api/v1, got %s", cfg.APIPrefix)
	}

	if cfg.DatabaseURL != "postgresql://postgres:postgres@127.0.0.1:54322/postgres" {
		t.Errorf("unexpected default DATABASE_URL: %s", cfg.DatabaseURL)
	}

	if len(cfg.CORSOrigins) != 1 || cfg.CORSOrigins[0] != "http://localhost:5173" {
		t.Errorf("unexpected default CORS origins: %v", cfg.CORSOrigins)
	}

	if cfg.SupabaseJWTAudience != "authenticated" {
		t.Errorf("expected audience 'authenticated', got %s", cfg.SupabaseJWTAudience)
	}
}

func TestLoad_CustomPort(t *testing.T) {
	os.Setenv("PORT", "8080")
	defer os.Unsetenv("PORT")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.Port != 8080 {
		t.Errorf("expected port 8080, got %d", cfg.Port)
	}
}

func TestLoad_InvalidPort(t *testing.T) {
	os.Setenv("PORT", "invalid")
	defer os.Unsetenv("PORT")

	_, err := Load()
	if err == nil {
		t.Error("expected error for invalid port")
	}
}

func TestParseCORSOrigins(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected []string
	}{
		{
			name:     "empty returns default",
			input:    "",
			expected: []string{"http://localhost:5173"},
		},
		{
			name:     "single origin",
			input:    "http://example.com",
			expected: []string{"http://example.com"},
		},
		{
			name:     "multiple origins",
			input:    "http://example.com, http://other.com",
			expected: []string{"http://example.com", "http://other.com"},
		},
		{
			name:     "with quotes",
			input:    `"http://example.com", "http://other.com"`,
			expected: []string{"http://example.com", "http://other.com"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := parseCORSOrigins(tt.input)
			if len(result) != len(tt.expected) {
				t.Errorf("expected %d origins, got %d: %v", len(tt.expected), len(result), result)
				return
			}
			for i, origin := range result {
				if origin != tt.expected[i] {
					t.Errorf("origin %d: expected %s, got %s", i, tt.expected[i], origin)
				}
			}
		})
	}
}
