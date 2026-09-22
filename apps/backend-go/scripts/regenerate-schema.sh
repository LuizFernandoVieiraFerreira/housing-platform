#!/usr/bin/env bash
set -euo pipefail

# Regenerate sqlc types from the Supabase-migrated database.
#
# This script:
# 1. Resets the local Supabase database (applies all migrations)
# 2. Dumps the public schema for sqlc introspection
# 3. Runs sqlc generate
#
# Prerequisites:
# - Supabase CLI installed and local instance running
# - sqlc installed (go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"
SCHEMA_FILE="$BACKEND_DIR/db/schema/public.sql"

echo "==> Resetting Supabase database..."
cd "$REPO_ROOT"
pnpm db:reset

echo "==> Dumping public schema for sqlc..."
cd "$REPO_ROOT"
supabase db dump --local --schema public -f "$SCHEMA_FILE"

if ! head -1 "$SCHEMA_FILE" | grep -qE '^(SET|CREATE|--|/\*)'; then
  echo "Error: schema dump does not look like SQL. Check Supabase is running."
  exit 1
fi

echo "==> Running sqlc generate..."
cd "$BACKEND_DIR"
if command -v sqlc &> /dev/null; then
  sqlc generate -f db/sqlc.yaml
  echo "sqlc types regenerated successfully."
else
  echo "Error: sqlc not installed. Install with: go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest"
  exit 1
fi

echo "==> Done. Review git diff before committing."
