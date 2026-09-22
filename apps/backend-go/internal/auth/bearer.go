package auth

import (
	"net/http"
	"regexp"
)

var bearerTokenPattern = regexp.MustCompile(`(?i)^Bearer\s+(.+)$`)

// ExtractBearerToken returns the bearer token from the Authorization header.
func ExtractBearerToken(r *http.Request) string {
	authorization := r.Header.Get("Authorization")
	if authorization == "" {
		return ""
	}

	match := bearerTokenPattern.FindStringSubmatch(authorization)
	if len(match) < 2 {
		return ""
	}

	token := match[1]
	if token == "" {
		return ""
	}

	return token
}
