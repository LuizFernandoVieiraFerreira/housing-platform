import preset from '@housing-platform/config/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [preset],
  theme: {
    extend: {
      /*
       * Named here rather than inlined as `bg-[url(...)]` so the marketing artwork
       * paths live in one place. These are app-owned assets under `public/images`,
       * which is why they are not in the shared design-tokens preset.
       */
      backgroundImage: {
        'city-skyline': "url('/images/background-city-skyline.svg')",
        'city-cloud': "url('/images/background-city-cloud.svg')",
        'city-cloud-large': "url('/images/background-city-cloud-large.svg')",
        'city-drone': "url('/images/background-city-drone.svg')",
      },
    },
  },
};
