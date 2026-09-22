package contract

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"gopkg.in/yaml.v3"
)

const APIPrefix = "/api/v1"

var pathParamPattern = regexp.MustCompile(`\{[^}]+\}`)

var httpMethods = map[string]struct{}{
	"get": {}, "post": {}, "put": {}, "patch": {},
	"delete": {}, "head": {}, "options": {},
}

// OperationKey identifies a normalized HTTP operation.
type OperationKey struct {
	NormalizedPath string
	Method         string
}

func (k OperationKey) String() string {
	return k.Method + ":" + k.NormalizedPath
}

// RequiredOperations lists canonical contract endpoints every REST backend must expose.
var RequiredOperations = []OperationKey{
	{"/api/v1/properties", "get"},
	{"/api/v1/properties", "post"},
	{"/api/v1/properties/{}", "get"},
	{"/api/v1/properties/{}/submit-review", "post"},
	{"/api/v1/properties/{}/location", "post"},
	{"/api/v1/bookings/quote", "get"},
	{"/api/v1/bookings", "get"},
	{"/api/v1/bookings", "post"},
	{"/api/v1/bookings/{}/cancel", "post"},
	{"/api/v1/bookings/{}/approve", "post"},
	{"/api/v1/bookings/{}/reject", "post"},
	{"/api/v1/payments/orders", "post"},
	{"/api/v1/payments/confirm", "post"},
	{"/api/v1/payments/webhook", "post"},
	{"/api/v1/hosts", "post"},
	{"/api/v1/hosts/me", "get"},
	{"/api/v1/admin/stats", "get"},
	{"/api/v1/notifications", "get"},
	{"/api/v1/notifications/unread-count", "get"},
	{"/api/v1/profile", "get"},
	{"/api/v1/profile", "patch"},
}

var contractErrorCodes = map[string]struct{}{
	"UNAUTHENTICATED":         {},
	"FORBIDDEN":               {},
	"NOT_FOUND":               {},
	"VALIDATION_ERROR":        {},
	"BOOKING_CONFLICT":        {},
	"BOOKING_EXPIRED":         {},
	"PAYMENT_FAILED":          {},
	"PAYMENT_AMOUNT_MISMATCH": {},
	"EXTERNAL_SERVICE_ERROR":  {},
	"RATE_LIMITED":            {},
	"INTERNAL_ERROR":          {},
}

func repoRoot() (string, error) {
	current, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		if _, err := os.Stat(filepath.Join(current, "packages", "api-contract", "openapi.yaml")); err == nil {
			return current, nil
		}

		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("could not locate packages/api-contract/openapi.yaml")
		}
		current = parent
	}
}

// CanonicalOpenAPIPath returns the repo-relative path to the canonical OpenAPI document.
func CanonicalOpenAPIPath() (string, error) {
	root, err := repoRoot()
	if err != nil {
		return "", err
	}
	return filepath.Join(root, "packages", "api-contract", "openapi.yaml"), nil
}

// LoadCanonicalOpenAPI reads and parses the canonical OpenAPI YAML document.
func LoadCanonicalOpenAPI() (map[string]any, error) {
	path, err := CanonicalOpenAPIPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var document map[string]any
	if err := yaml.Unmarshal(data, &document); err != nil {
		return nil, err
	}
	return document, nil
}

// NormalizePath replaces path parameters with {} placeholders and trims trailing slashes.
func NormalizePath(path string) string {
	normalized := pathParamPattern.ReplaceAllString(path, "{}")
	if len(normalized) > 1 && strings.HasSuffix(normalized, "/") {
		normalized = strings.TrimSuffix(normalized, "/")
	}
	return normalized
}

// ListPathOperations indexes operations from an OpenAPI paths object.
func ListPathOperations(document map[string]any) map[OperationKey]string {
	paths, ok := document["paths"].(map[string]any)
	if !ok {
		return map[OperationKey]string{}
	}

	operations := make(map[OperationKey]string)
	for path, rawPathItem := range paths {
		pathItem, ok := rawPathItem.(map[string]any)
		if !ok {
			continue
		}

		for method, rawOperation := range pathItem {
			if _, ok := httpMethods[method]; !ok {
				continue
			}
			if _, ok := rawOperation.(map[string]any); !ok {
				continue
			}

			key := OperationKey{
				NormalizedPath: NormalizePath(path),
				Method:         method,
			}
			operations[key] = path
		}
	}

	return operations
}

// AssertErrorEnvelope validates the standard API error response shape.
func AssertErrorEnvelope(body map[string]any) error {
	rawError, ok := body["error"].(map[string]any)
	if !ok {
		return fmt.Errorf("expected error envelope with 'error' object")
	}

	allowedKeys := map[string]struct{}{
		"code": {}, "message": {}, "details": {},
	}
	for key := range rawError {
		if _, ok := allowedKeys[key]; !ok {
			return fmt.Errorf("unexpected error keys: %v", keysOf(rawError))
		}
	}

	code, ok := rawError["code"].(string)
	if !ok {
		return fmt.Errorf("unexpected error code: %v", rawError["code"])
	}
	if _, ok := contractErrorCodes[code]; !ok {
		return fmt.Errorf("unexpected error code: %s", code)
	}

	message, ok := rawError["message"].(string)
	if !ok || strings.TrimSpace(message) == "" {
		return fmt.Errorf("expected non-empty error message")
	}

	if details, ok := rawError["details"]; ok {
		if detailsMap, ok := details.(map[string]any); !ok || detailsMap == nil {
			return fmt.Errorf("expected error details to be an object")
		}
	}

	return nil
}

func keysOf(values map[string]any) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	return keys
}
