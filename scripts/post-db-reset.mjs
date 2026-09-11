#!/usr/bin/env node
/**
 * Runs after `supabase db reset` to backfill property embeddings when Edge Functions are up.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function readSupabaseStatus() {
  const output = execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return JSON.parse(output);
}

async function isFunctionsReachable(functionsUrl, serviceRoleKey) {
  try {
    const response = await fetch(`${functionsUrl.replace(/\/$/, '')}/sync-property-embedding`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ propertyId: '00000000-0000-4000-8000-000000000000' }),
    });

    return response.status !== 404;
  } catch {
    return false;
  }
}

async function main() {
  const status = readSupabaseStatus();
  const functionsUrl = status.FUNCTIONS_URL;
  const serviceRoleKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;

  if (!functionsUrl || !serviceRoleKey) {
    console.warn(
      'Skipping embedding backfill: Supabase status missing functions URL or service role key.',
    );
    return;
  }

  const envPath = join(repoRoot, 'supabase/functions/.env');
  if (!process.env.OPENAI_API_KEY && !existsSync(envPath)) {
    console.warn(
      'Skipping embedding backfill: set OPENAI_API_KEY in supabase/functions/.env and run `pnpm seed:embeddings` when ready.',
    );
    return;
  }

  const reachable = await isFunctionsReachable(functionsUrl, serviceRoleKey);

  if (!reachable) {
    console.warn(
      'Skipping embedding backfill: Edge Functions are not reachable. Start `supabase functions serve`, then run `pnpm seed:embeddings`.',
    );
    console.warn(
      'Pending listings will stay queued until the retry cron runs or you backfill manually.',
    );
    return;
  }

  execFileSync('pnpm', ['seed:embeddings'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
