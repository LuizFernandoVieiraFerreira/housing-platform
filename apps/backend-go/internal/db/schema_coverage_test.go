package db

import (
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

// expectedModels maps public tables to sqlc-generated Go struct names.
var expectedModels = []string{
	"Amenity",
	"ApiRateLimit",
	"AuditLog",
	"BookingPriceSnapshot",
	"Booking",
	"Host",
	"HousingRequest",
	"LocationAlias",
	"Notification",
	"PaymentEvent",
	"Payment",
	"PlatformSetting",
	"Profile",
	"PropertyAmenity",
	"PropertyImage",
	"PropertySearchEmbedding",
	"Property",
	"RoomImage",
	"Room",
}

func TestExpectedTableCount(t *testing.T) {
	if len(expectedModels) != 19 {
		t.Fatalf("expected 19 public tables, got %d", len(expectedModels))
	}
}

func TestSchemaCoverage(t *testing.T) {
	modelsPath := modelsFilePath(t)
	source, err := os.ReadFile(modelsPath)
	if err != nil {
		t.Fatalf("read models.go: %v", err)
	}

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, modelsPath, source, parser.ParseComments)
	if err != nil {
		t.Fatalf("parse models.go: %v", err)
	}

	actual := make(map[string]struct{})
	for _, decl := range file.Decls {
		genDecl, ok := decl.(*ast.GenDecl)
		if !ok || genDecl.Tok != token.TYPE {
			continue
		}
		for _, spec := range genDecl.Specs {
			typeSpec, ok := spec.(*ast.TypeSpec)
			if !ok {
				continue
			}
			if _, isStruct := typeSpec.Type.(*ast.StructType); isStruct {
				actual[typeSpec.Name.Name] = struct{}{}
			}
		}
	}

	for _, model := range expectedModels {
		if _, ok := actual[model]; !ok {
			t.Errorf("missing sqlc model for public table: %s", model)
		}
	}
}

func TestNoAuthSchemaModels(t *testing.T) {
	source, err := os.ReadFile(modelsFilePath(t))
	if err != nil {
		t.Fatalf("read models.go: %v", err)
	}

	content := string(source)
	if strings.Contains(content, "AuthUser") {
		t.Error("models.go should not include auth schema models")
	}
}

func modelsFilePath(t *testing.T) string {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("unable to resolve test file path")
	}

	return filepath.Join(filepath.Dir(filename), "models.go")
}
