#!/usr/bin/env node
/**
 * Sync property search embeddings via the local sync-property-embedding Edge Function.
 * Works without `supabase functions invoke` (not available in all CLI versions).
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *   OPENAI_API_KEY in supabase/functions/.env
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function readSupabaseStatus() {
  try {
    const output = execFileSync('supabase', ['status', '-o', 'json'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return JSON.parse(output);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to read Supabase status. Run \`supabase start\` first.\n${message}`,
    );
  }
}

async function main() {
  const propertyId = process.argv.find((arg) => arg.startsWith('--property-id='))?.split('=')[1];

  const status = readSupabaseStatus();
  const functionsUrl = process.env.SUPABASE_FUNCTIONS_URL ?? status.FUNCTIONS_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;

  if (!functionsUrl || !serviceRoleKey) {
    throw new Error('Missing FUNCTIONS_URL or SERVICE_ROLE_KEY from supabase status.');
  }

  const envPath = join(repoRoot, 'supabase/functions/.env');
  if (!process.env.OPENAI_API_KEY && !existsSync(envPath)) {
    console.warn(
      'Warning: supabase/functions/.env not found. Ensure OPENAI_API_KEY is set for functions serve.',
    );
  }

  const body = propertyId ? { propertyId } : { allPublished: true };
  const endpoint = `${functionsUrl.replace(/\/$/, '')}/sync-property-embedding`;

  console.log(`POST ${endpoint}`);
  console.log(JSON.stringify(body));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('Embedding sync failed:', payload ?? response.statusText);
    process.exit(1);
  }

  console.log(JSON.stringify(payload, null, 2));

  const failed = payload?.summary?.failed ?? 0;

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
