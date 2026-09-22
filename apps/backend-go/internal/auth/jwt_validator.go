package auth

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/config"
)

var uuidPattern = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)

// JWTClaims holds validated Supabase access token claims.
type JWTClaims struct {
	UserID string
	Email  string
}

// JWTValidator validates Supabase Auth access tokens via JWKS or HS256 secret.
type JWTValidator struct {
	audience string
	issuer   string
	secret   []byte
	jwks     jwt.Keyfunc
}

// NewJWTValidator creates a validator configured from application settings.
func NewJWTValidator(ctx context.Context, cfg *config.Config) (*JWTValidator, error) {
	issuer := strings.TrimSuffix(cfg.SupabaseURL, "/") + "/auth/v1"
	jwksURL := issuer + "/.well-known/jwks.json"

	jwks, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("initialize JWKS client: %w", err)
	}

	var secret []byte
	if trimmed := strings.TrimSpace(cfg.SupabaseJWTSecret); trimmed != "" {
		secret = []byte(trimmed)
	}

	return &JWTValidator{
		audience: cfg.SupabaseJWTAudience,
		issuer:   issuer,
		secret:   secret,
		jwks:     jwks.Keyfunc,
	}, nil
}

// Validate parses and verifies a Supabase access token.
func (v *JWTValidator) Validate(token string) (JWTClaims, error) {
	payload, err := v.decodeToken(token)
	if err != nil {
		return JWTClaims{}, apierrors.Unauthorized("Invalid or expired access token")
	}

	return v.toClaims(payload)
}

func (v *JWTValidator) decodeToken(token string) (jwt.MapClaims, error) {
	parser := jwt.NewParser(jwt.WithValidMethods(nil))

	unverified, _, err := parser.ParseUnverified(token, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}

	algorithm, _ := unverified.Header["alg"].(string)
	if algorithm == jwt.SigningMethodHS256.Alg() {
		if len(v.secret) == 0 {
			return nil, fmt.Errorf("HS256 token requires SUPABASE_JWT_SECRET")
		}

		verified, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
			if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return v.secret, nil
		}, jwt.WithAudience(v.audience), jwt.WithIssuer(v.issuer))
		if err != nil {
			return nil, err
		}

		claims, ok := verified.Claims.(jwt.MapClaims)
		if !ok || !verified.Valid {
			return nil, fmt.Errorf("invalid token claims")
		}
		return claims, nil
	}

	if algorithm == "" {
		return nil, fmt.Errorf("token header is missing a supported algorithm")
	}

	verified, err := jwt.Parse(token, v.jwks, jwt.WithAudience(v.audience))
	if err != nil {
		return nil, err
	}

	claims, ok := verified.Claims.(jwt.MapClaims)
	if !ok || !verified.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return claims, nil
}

func (v *JWTValidator) toClaims(payload jwt.MapClaims) (JWTClaims, error) {
	role, _ := payload["role"].(string)
	if role != "authenticated" {
		return JWTClaims{}, apierrors.Unauthorized("Access token is not for an authenticated user")
	}

	subject, _ := payload["sub"].(string)
	if subject == "" || !uuidPattern.MatchString(subject) {
		return JWTClaims{}, apierrors.Unauthorized("Access token is missing a valid subject")
	}

	email, _ := payload["email"].(string)
	if email == "" {
		email = ""
	}

	return JWTClaims{
		UserID: subject,
		Email:  email,
	}, nil
}
