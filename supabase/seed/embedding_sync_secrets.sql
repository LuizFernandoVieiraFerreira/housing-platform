-- Vault secrets for pg_net → sync-property-embedding (local dev defaults).
-- Postgres reads these; Edge Functions cannot. Embedding auto-sync only — not general app config.
-- In production, set via SQL editor with your project values:
--   supabase_url      → https://<project-ref>.supabase.co
--   service_role_key  → project service role key (never expose to browsers)

select set_config('hik.defer_embedding_sync', 'on', true);

select vault.create_secret(
  'http://api.supabase.internal:8000',
  'supabase_url',
  'Supabase API URL used by pg_net embedding sync'
);

select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  'service_role_key',
  'Service role key used by pg_net embedding sync'
);
