#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DATABASE_URL="${DATABASE_URL:-postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres}"

cd "$ROOT"

poetry run sqlacodegen "$DATABASE_URL" \
  --generator declarative \
  --schemas public \
  --outfile src/housing_platform/db/models_generated.py

python3 scripts/postprocess_models.py

echo "Models regenerated. Review git diff before committing."
