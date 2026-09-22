.PHONY: dev build test lint clean generate tidy

SQLC ?= $(shell command -v sqlc 2>/dev/null || echo $(HOME)/go/bin/sqlc)

# Default target
all: build

# Run development server with hot reload (requires air: go install github.com/air-verse/air@latest)
dev:
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "air not installed. Running without hot reload..."; \
		go run ./cmd/server; \
	fi

# Build the server binary
build:
	go build -o bin/server ./cmd/server

# Run tests
test:
	go test -v ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Lint (requires golangci-lint)
lint:
	golangci-lint run ./...

# Clean build artifacts
clean:
	rm -rf bin/ coverage.out coverage.html

# Generate sqlc types (requires sqlc and db/schema/public.sql)
generate:
	$(SQLC) generate -f db/sqlc.yaml

# Tidy dependencies
tidy:
	go mod tidy

# Regenerate schema from Supabase migrations
regenerate-schema:
	./scripts/regenerate-schema.sh

# Type check (Go compiles, so this is effectively build)
typecheck: build
