import { createTailwindTheme, screens } from '../design-tokens/tailwind-theme.ts';

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    screens,
    extend: createTailwindTheme(),
  },
  plugins: [],
};
