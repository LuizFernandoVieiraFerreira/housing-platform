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
    screens: tokens.breakpoints,
    transitionDuration: {
      DEFAULT: tokens.transitionDuration.default,
      interaction: tokens.transitionDuration.interaction,
    },
  };
}
