import { reactConfig } from '@housing-platform/config/eslint/react';

export default [
  // Vendored third-party script served as-is from `public`.
  { ignores: ['public/scripts/**'] },
  ...reactConfig,
];
