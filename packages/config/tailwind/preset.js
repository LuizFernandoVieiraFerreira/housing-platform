import { createTailwindTheme } from '../design-tokens/tailwind-theme.ts';

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: createTailwindTheme(),
  },
  plugins: [],
};
