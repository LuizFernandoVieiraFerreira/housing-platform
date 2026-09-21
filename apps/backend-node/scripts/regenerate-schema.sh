#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"

cd "$REPO_ROOT"
pnpm db:reset

cd "$ROOT"
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

node scripts/prepare-pull-schema.mjs
pnpm exec prisma db pull --schema prisma/schema.prisma
node scripts/postprocess-schema.mjs
pnpm exec prisma generate

echo "Prisma schema regenerated. Review git diff before committing."
