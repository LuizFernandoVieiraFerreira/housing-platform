#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/../.." && pwd)"

cd "$REPO_ROOT"
pnpm db:reset

cd "$ROOT"
mvn -q -Pentity-generation org.hibernate.tool:hibernate-tools-maven:hbm2java

echo "Entities regenerated. Review git diff and re-apply manual type mappings before committing."
