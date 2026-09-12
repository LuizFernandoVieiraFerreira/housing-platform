/**
 * CVA (class-variance-authority) variants for shared styling patterns.
 *
 * These extract high-density Tailwind class combinations into reusable,
 * type-safe variants. Use these instead of inline class strings > 10 classes.
 *
 * @example
 * import { heroHeadline, marketingHero } from '@/shared/lib/variants';
 *
 * <section className={marketingHero()}>
 *   <h1 className={heroHeadline()}>...</h1>
 * </section>
 */
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Marketing hero section container.
 * Used on landing pages (home, for-hosts, for-photographers, etc.)
 */
export const marketingHero = cva(
  [
    'flex flex-col px-4 sm:px-6 lg:px-20',
    'min-h-marketing-hero md:min-h-marketing-hero-md xl:min-h-marketing-hero-xl 2xl:min-h-marketing-hero-2xl',
  ],
  {
    variants: {
      align: {
        start: 'items-start justify-start',
        center: 'items-center justify-center',
      },
      background: {
        skyline: 'home-hero-skyline bg-surface-page',
        brand: 'bg-brand-50',
        roles: 'bg-marketing-roles text-white',
      },
    },
    defaultVariants: {
      align: 'start',
      background: 'skyline',
    },
  },
);
export type MarketingHeroVariants = VariantProps<typeof marketingHero>;

/**
 * Hero headline typography.
 * Responsive sizing from mobile (1.6rem) → xl (3.3rem).
 */
export const heroHeadline = cva(
  [
    'text-ink mx-auto',
    'text-[1.6rem] xs:text-[1.85rem] sm:text-[2rem] lg:text-[2.8rem] xl:text-[3.3rem]',
    'font-extrabold lg:font-black',
    'leading-[1.17]',
    'tracking-[-1.2px] lg:tracking-[-2.1px]',
  ],
  {
    variants: {
      spacing: {
        default: 'mb-4 mt-6 sm:mb-3',
        compact: 'mb-2 mt-4',
      },
    },
    defaultVariants: {
      spacing: 'default',
    },
  },
);
export type HeroHeadlineVariants = VariantProps<typeof heroHeadline>;

/**
 * Responsive icon container.
 * Mobile: 36×36 icon fills container.
 * 510px+: 80×80 circular border, icon centers at 40×40.
 */
export const responsiveIconContainer = cva(
  [
    'flex shrink-0 items-center justify-center',
    'h-9 w-9',
    'min-[510px]:h-20 min-[510px]:w-20',
    'min-[510px]:rounded-full min-[510px]:border-[3px]',
  ],
  {
    variants: {
      position: {
        /** Centered on mobile, left-aligned with margin on desktop */
        centered: 'mx-auto mb-2 xs:mx-0 xs:mb-0 xs:mr-4 min-[510px]:mr-7',
        /** Always inline */
        inline: 'mr-3',
      },
      borderColor: {
        white: 'min-[510px]:border-white',
        brand: 'min-[510px]:border-brand-500',
        subtle: 'min-[510px]:border-surface-subtle',
      },
    },
    defaultVariants: {
      position: 'centered',
      borderColor: 'white',
    },
  },
);
export type ResponsiveIconContainerVariants = VariantProps<typeof responsiveIconContainer>;

/**
 * Icon sizing inside responsiveIconContainer.
 * Full size on mobile, fixed 40×40 on desktop.
 */
export const responsiveIcon = cva('h-full w-full min-[510px]:h-10 min-[510px]:w-10');

/**
 * Floating action button (FAB).
 * Fixed position, circular, with hover/active states.
 */
export const fab = cva(
  [
    'fixed z-40 overflow-hidden rounded-full shadow-lg',
    'transition-transform hover:scale-105 active:scale-95',
    'disabled:opacity-70',
  ],
  {
    variants: {
      size: {
        md: 'h-12 w-12',
        lg: 'h-14 w-14',
      },
      position: {
        /** Bottom-right, adjusts for mobile nav */
        bottomRight: 'bottom-20 right-4 md:bottom-6',
        /** Bottom-left, adjusts for mobile nav */
        bottomLeft: 'bottom-20 left-4 md:bottom-6',
      },
    },
    defaultVariants: {
      size: 'lg',
      position: 'bottomRight',
    },
  },
);
export type FabVariants = VariantProps<typeof fab>;

/**
 * Roles section column layout.
 * Handles the two-column split at 1000px breakpoint.
 */
export const rolesColumn = cva('', {
  variants: {
    side: {
      video: 'pb-6 min-[1000px]:w-[44%] min-[1000px]:pb-0 min-[1000px]:text-left',
      links:
        'mx-auto max-w-[480px] min-[1000px]:mx-0 min-[1000px]:flex min-[1000px]:w-[49.5%] min-[1000px]:max-w-none min-[1000px]:flex-col min-[1000px]:justify-between min-[1000px]:gap-7',
    },
  },
});
export type RolesColumnVariants = VariantProps<typeof rolesColumn>;

/**
 * Role link card in the roles section.
 * Stacked on mobile, horizontal flex from 400px+.
 */
export const roleLink = cva([
  'group pb-9 min-[1000px]:pb-0',
  'xs:flex xs:items-center xs:text-left',
]);

/**
 * Search bar container with focus ring styling.
 */
export const searchBarContainer = cva([
  'flex items-center gap-2 rounded-full bg-white',
  'border border-surface-subtle shadow-panel',
  'py-1.5 pl-5 pr-1.5',
  'focus-within:ring-2 focus-within:ring-brand-400',
]);

/**
 * Animated label (for hero rotation).
 */
export const animatedLabel = cva('inline-block', {
  variants: {
    color: {
      brand: 'text-brand-500',
      ink: 'text-ink',
    },
    animate: {
      fadeIn: 'animate-hero-label-fade-in motion-reduce:animate-none',
      none: '',
    },
  },
  defaultVariants: {
    color: 'brand',
    animate: 'fadeIn',
  },
});
export type AnimatedLabelVariants = VariantProps<typeof animatedLabel>;
