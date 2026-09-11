export const tokens = {
  colors: {
    brand: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
      950: '#500724',
    },
    brown: {
      500: '#8b3f11',
    },
    surface: {
      DEFAULT: '#ffffff',
      page: '#fdf2f8',
      muted: '#f7f7f8',
      subtle: '#efeff1',
    },
    ink: {
      DEFAULT: '#1f1c1c',
      muted: '#4b5563',
      subtle: '#9ca3af',
    },
    status: {
      success: {
        default: '#14532d',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        foreground: '#14532d',
      },
      error: {
        default: '#991b1b',
        bg: '#fef2f2',
        border: '#fecaca',
        foreground: '#991b1b',
      },
      warning: {
        default: '#92400e',
        bg: '#fffbeb',
        border: '#fde68a',
        foreground: '#92400e',
      },
      info: {
        default: '#111827',
        bg: '#f7f7f8',
        border: '#efeff1',
        foreground: '#111827',
      },
    },
    /**
     * Fixed palette for the public marketing surfaces (home, professional landings).
     * Deliberately outside the role themes: these blocks keep their colours when the
     * brand scale is re-themed per role, so they cannot be expressed as `brand.*`.
     */
    marketing: {
      'share-house': { DEFAULT: '#00c86f', hover: '#08cc75' },
      studio: { DEFAULT: '#009bdd', hover: '#08a0e1' },
      'micro-studio': { DEFAULT: '#f1634b', hover: '#f26d56' },
      'multi-bedroom': { DEFAULT: '#fdc14a', hover: '#fdc84a' },
      /** Sampled from the skyline SVG's ground fill so the band continues it seamlessly. */
      roles: '#4bb97a',
      steps: '#324c64',
    },
    semantic: {
      primary: '#ec4899',
      primaryHover: '#db2777',
      primarySubtle: '#fdf2f8',
      primaryMuted: '#fce7f3',
      onPrimary: '#ffffff',
      background: '#ffffff',
      backgroundMuted: '#f7f7f8',
      backgroundPage: '#fdf2f8',
      border: '#efeff1',
      foreground: '#1f1c1c',
      foregroundMuted: '#4b5563',
      foregroundSubtle: '#9ca3af',
    },
  },
  fontFamily: {
    sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
  },
  spacing: {
    page: '1rem',
    pageSm: '1.5rem',
    section: '2.5rem',
    sectionLg: '4rem',
  },
  sizes: {
    contentMax: '90rem',
    accommodationCard: '7.5rem',
    /** Shared hero min-heights for home and professional platform landings. */
    marketingHero: '400px',
    marketingHeroMd: '596px',
    marketingHeroXl: '639px',
    marketingHero2xl: '648px',
  },
  gaps: {
    nav: 'clamp(32px, 4vw, 48px)',
  },
  scales: {
    cardHover: '1.04',
    cardActive: '0.98',
  },
  radii: {
    lg: '0.625rem',
    xl: '0.875rem',
    '2xl': '1rem',
    full: '9999px',
  },
  shadows: {
    card: '0 8px 24px rgba(17, 24, 39, 0.08)',
    panel: '0 1px 3px rgba(17, 24, 39, 0.06)',
    overlay: '0 20px 40px rgba(17, 24, 39, 0.12)',
  },
  breakpoints: {
    /**
     * Narrow-phone step below `sm`. Earns its place because the marketing role list
     * flips from stacked to icon-beside-copy well before 640px would allow.
     */
    xs: '400px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  transitionDuration: {
    default: '150ms',
    interaction: '200ms',
  },
  /** Durations for the named keyframe animations exposed as `animate-*` utilities. */
  animationDuration: {
    heroLabel: '300ms',
    cloudDrift: '4s',
    cloudDriftSlow: '5s',
    dronePatrol: '20s',
    appBannerMarquee: '25s',
  },
} as const;

export type DesignTokens = typeof tokens;
