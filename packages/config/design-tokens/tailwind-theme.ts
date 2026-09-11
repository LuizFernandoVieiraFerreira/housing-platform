import { brandScaleSteps } from './role-themes';
import { tokens } from './tokens';

function mapBrandToCssVars() {
  return Object.fromEntries(
    brandScaleSteps.map((step) => [step, `rgb(var(--brand-${step}) / <alpha-value>)`]),
  );
}

function mapStatusColors(status: (typeof tokens.colors.status)[keyof typeof tokens.colors.status]) {
  return {
    DEFAULT: status.default,
    bg: status.bg,
    border: status.border,
    foreground: status.foreground,
  };
}

/**
 * Applied at `theme.screens` rather than `theme.extend.screens`: extending appends
 * new keys after the defaults, so `xs` would emit its utilities *after* `2xl` and
 * `xs:text-left` would beat `lg:text-center`. A full override keeps the media
 * queries in ascending order, which is what the variant precedence relies on.
 */
export const screens = tokens.breakpoints;

const keyframes = {
  'hero-label-fade-in': {
    from: { opacity: '0', transform: 'translateY(-0.25rem)' },
    to: { opacity: '1', transform: 'translateY(0)' },
  },
  'app-banner-marquee': {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(-50%)' },
  },
  'cloud-drift': {
    to: { transform: 'translate3d(-15%, 0, 0)' },
  },
  'drone-patrol': {
    '0%, 10%, 100%': { transform: 'translate3d(0, 100%, 0)', opacity: '1' },
    '25%, 35%': { transform: 'scale(0.8) translate3d(250%, 0%, 0)', opacity: '0.5' },
    '50%, 60%': { transform: 'translate3d(100%, 150%, 0)', opacity: '1' },
    '70%, 80%': { transform: 'scale(1.15) translate3d(200%, 300%, 0)' },
  },
};

const animation = {
  'hero-label-fade-in': `hero-label-fade-in ${tokens.animationDuration.heroLabel} ease-out`,
  'app-banner-marquee': `app-banner-marquee ${tokens.animationDuration.appBannerMarquee} linear infinite`,
  /*
   * The three clouds share one keyframe but differ in tempo and easing, which is the
   * only reason they don't visibly drift in lockstep. Keep all three.
   */
  'cloud-drift': `cloud-drift ${tokens.animationDuration.cloudDrift} linear infinite alternate`,
  'cloud-drift-out': `cloud-drift ${tokens.animationDuration.cloudDrift} ease-out infinite alternate`,
  'cloud-drift-in': `cloud-drift ${tokens.animationDuration.cloudDriftSlow} ease-in infinite alternate`,
  'drone-patrol': `drone-patrol ${tokens.animationDuration.dronePatrol} linear infinite`,
};

export function createTailwindTheme() {
  return {
    colors: {
      brand: mapBrandToCssVars(),
      brown: tokens.colors.brown,
      surface: tokens.colors.surface,
      ink: tokens.colors.ink,
      marketing: tokens.colors.marketing,
      status: {
        success: mapStatusColors(tokens.colors.status.success),
        error: mapStatusColors(tokens.colors.status.error),
        warning: mapStatusColors(tokens.colors.status.warning),
        info: mapStatusColors(tokens.colors.status.info),
      },
      semantic: {
        primary: 'rgb(var(--brand-500) / <alpha-value>)',
        'primary-hover': 'rgb(var(--brand-600) / <alpha-value>)',
        'primary-subtle': 'rgb(var(--brand-50) / <alpha-value>)',
        'primary-muted': 'rgb(var(--brand-100) / <alpha-value>)',
        'on-primary': tokens.colors.semantic.onPrimary,
        background: tokens.colors.semantic.background,
        'background-muted': tokens.colors.semantic.backgroundMuted,
        'background-page': tokens.colors.semantic.backgroundPage,
        border: tokens.colors.semantic.border,
        foreground: tokens.colors.semantic.foreground,
        'foreground-muted': tokens.colors.semantic.foregroundMuted,
        'foreground-subtle': tokens.colors.semantic.foregroundSubtle,
      },
    },
    fontFamily: tokens.fontFamily,
    spacing: {
      page: tokens.spacing.page,
      'page-sm': tokens.spacing.pageSm,
      section: tokens.spacing.section,
      'section-lg': tokens.spacing.sectionLg,
    },
    maxWidth: {
      content: tokens.sizes.contentMax,
    },
    height: {
      'accommodation-card': tokens.sizes.accommodationCard,
    },
    minHeight: {
      'marketing-hero': tokens.sizes.marketingHero,
      'marketing-hero-md': tokens.sizes.marketingHeroMd,
      'marketing-hero-xl': tokens.sizes.marketingHeroXl,
      'marketing-hero-2xl': tokens.sizes.marketingHero2xl,
    },
    gap: {
      nav: tokens.gaps.nav,
    },
    scale: {
      'card-hover': tokens.scales.cardHover,
      'card-active': tokens.scales.cardActive,
    },
    borderRadius: {
      lg: tokens.radii.lg,
      xl: tokens.radii.xl,
      '2xl': tokens.radii['2xl'],
    },
    boxShadow: tokens.shadows,
    transitionDuration: {
      DEFAULT: tokens.transitionDuration.default,
      interaction: tokens.transitionDuration.interaction,
    },
    keyframes,
    animation,
  };
}
