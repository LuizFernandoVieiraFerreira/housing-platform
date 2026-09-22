package auth

import (
	"net/http"
	"testing"
)

func TestExtractBearerToken(t *testing.T) {
	tests := []struct {
		name   string
		header string
		want   string
	}{
		{
			name:   "missing header",
			header: "",
			want:   "",
		},
		{
			name:   "valid bearer token",
			header: "Bearer token-value",
			want:   "token-value",
		},
		{
			name:   "case insensitive scheme",
			header: "bearer token-value",
			want:   "token-value",
		},
		{
			name:   "invalid scheme",
			header: "Basic token-value",
			want:   "",
		},
		{
			name:   "empty token",
			header: "Bearer ",
			want:   "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &http.Request{Header: http.Header{}}
			if tt.header != "" {
				req.Header.Set("Authorization", tt.header)
			}

			if got := ExtractBearerToken(req); got != tt.want {
				t.Fatalf("ExtractBearerToken() = %q, want %q", got, tt.want)
			}
		})
	}
}
