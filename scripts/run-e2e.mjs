#!/usr/bin/env node
/**
 * Runs Playwright E2E tests with edge functions available for checkout flows.
 *
 * Starts `supabase functions serve` when payment endpoints are not reachable,
 * then runs the Playwright suite.
 */

import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

function ensurePaymentDevMockEnv() {
  const envPath = path.join(repoRoot, 'supabase/functions/.env');
  const line = 'PAYMENT_DEV_MOCK=true';

  if (!existsSync(envPath)) {
    appendFileSync(envPath, `${line}\n`);
    return;
  }

  const contents = readFileSync(envPath, 'utf8');
  if (!contents.split('\n').some((entry) => entry.startsWith('PAYMENT_DEV_MOCK='))) {
    appendFileSync(envPath, `\n${line}\n`);
  }
}

async function paymentFunctionsReady() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ bookingId: '00000000-0000-0000-0000-000000000001' }),
    });

    clearTimeout(timeout);
    return response.status < 500;
  } catch {
    clearTimeout(timeout);
    return false;
  }
}

async function waitForPaymentFunctions(maxWaitMs = 60_000) {
  const deadline = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    if (await paymentFunctionsReady()) {
      return true;
    }

    await sleep(2_000);
  }

  return false;
}

let functionsProcess;

function startFunctionsServe() {
  ensurePaymentDevMockEnv();

  functionsProcess = spawn('supabase', ['functions', 'serve'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

function stopFunctionsServe() {
  if (functionsProcess && !functionsProcess.killed) {
    functionsProcess.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  stopFunctionsServe();
  process.exit(130);
});

process.on('SIGTERM', () => {
  stopFunctionsServe();
  process.exit(143);
});

const startedFunctions = !(await paymentFunctionsReady());

if (startedFunctions) {
  console.log('Starting Supabase edge functions for E2E checkout flows…');
  startFunctionsServe();

  const ready = await waitForPaymentFunctions();
  if (!ready) {
    stopFunctionsServe();
    console.error(
      'Timed out waiting for edge functions. Ensure Supabase is running (`supabase start`).',
    );
    process.exit(1);
  }
}

// Ensure dev mock payment is enabled in the client build by unsetting the Toss key
const e2eEnv = {
  ...process.env,
  VITE_TOSS_CLIENT_KEY: '', // Explicitly clear to enable client-side dev mock
};

const playwright = spawnSync('pnpm', ['--dir', 'tests/e2e', 'exec', 'playwright', 'test'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: e2eEnv,
});

if (startedFunctions) {
  stopFunctionsServe();
}

process.exit(playwright.status ?? 1);
