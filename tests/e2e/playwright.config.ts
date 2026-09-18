import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../apps/web');

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4173';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const previewCommand = process.env.CI
  ? 'pnpm exec vite preview --host 127.0.0.1 --port 4173'
  : 'pnpm run e2e:serve';

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_SKIP_WEB_SERVER
    ? undefined
    : {
        command: previewCommand,
        cwd: webDir,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        env: {
          ...process.env,
          VITE_SUPABASE_URL: supabaseUrl,
          VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
          VITE_APP_URL: baseURL,
        },
      },
});
