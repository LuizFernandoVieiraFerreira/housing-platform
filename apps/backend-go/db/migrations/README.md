# Database Migrations

**DO NOT ADD MIGRATION FILES HERE.**

This Go backend does NOT own database migrations.

The canonical schema source is `supabase/migrations/` at the repository root.
All schema changes must be authored as Supabase SQL migrations.

sqlc generates Go types by introspecting the already-migrated database.
Run `make regenerate-schema` after Supabase migrations are applied to regenerate types.

See [docs/database-ownership.md](../../../../docs/database-ownership.md) for details.
