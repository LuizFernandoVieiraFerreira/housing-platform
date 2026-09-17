import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(configDir, '..');
const packagesDir = path.resolve(webDir, '../../packages');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-links',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: false,
  },
  docs: {
    autodocs: 'tag',
  },
  async viteFinal(viteConfig) {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      // App source
      '@': path.resolve(webDir, 'src'),

      // Workspace packages (source imports for HMR)
      '@housing-platform/types': path.resolve(packagesDir, 'types/src'),
      '@housing-platform/ui': path.resolve(packagesDir, 'ui/src'),
      '@housing-platform/utils': path.resolve(packagesDir, 'utils/src'),
      '@housing-platform/validation': path.resolve(packagesDir, 'validation/src'),

      // Config package subpath exports - order matters! More specific paths first.
      // CSS imports (must come before JS to avoid path conflicts)
      '@housing-platform/config/design-tokens/role-theme-vars.css': path.resolve(
        packagesDir,
        'config/design-tokens/role-theme-vars.css',
      ),
      // JS imports
      '@housing-platform/config/design-tokens/role-themes': path.resolve(
        packagesDir,
        'config/design-tokens/role-themes.ts',
      ),
      '@housing-platform/config/design-tokens/favicon-svg': path.resolve(
        packagesDir,
        'config/design-tokens/favicon-svg.ts',
      ),
      '@housing-platform/config/design-tokens': path.resolve(
        packagesDir,
        'config/design-tokens/tokens.ts',
      ),
    };

    // Pre-bundle workspace packages to avoid ESM issues
    viteConfig.optimizeDeps ??= {};
    viteConfig.optimizeDeps.include = [
      ...(viteConfig.optimizeDeps.include ?? []),
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'react-i18next',
      'i18next',
    ];

    return viteConfig;
  },
};

export default config;
