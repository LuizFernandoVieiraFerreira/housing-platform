import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(rootDir, '../../packages');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@housing-platform/ui': path.resolve(packagesDir, 'ui/src'),
      '@housing-platform/types': path.resolve(packagesDir, 'types/src'),
      '@housing-platform/utils': path.resolve(packagesDir, 'utils/src'),
      '@housing-platform/validation': path.resolve(packagesDir, 'validation/src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_APP_URL: 'http://localhost:5173',
    },
  },
});
