-- End bulk seed: allow triggers to invoke sync, then queue any pending listings.
-- Actual embedding generation still requires Edge Functions + OPENAI_API_KEY.
-- Local dev: run `pnpm db:reset` (includes seed:embeddings) or `pnpm seed:embeddings`.

select set_config('hik.defer_embedding_sync', 'off', true);

select public.retry_pending_property_embedding_syncs(100);
