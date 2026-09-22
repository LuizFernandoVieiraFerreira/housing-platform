package shared

import (
	"strings"

	"github.com/housing-platform/backend-go/internal/config"
)

const propertyImagesBucket = "property-images"

func ResolvePropertyImageURL(cfg *config.Config, storagePath string) string {
	if strings.HasPrefix(storagePath, "http://") || strings.HasPrefix(storagePath, "https://") {
		return storagePath
	}
	base := strings.TrimSuffix(cfg.SupabaseURL, "/")
	path := strings.TrimPrefix(storagePath, "/")
	return base + "/storage/v1/object/public/" + propertyImagesBucket + "/" + path
}
