import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
  server: {
    port: 5173,
  },
});
