import { syncDocumentFavicon } from './favicon-svg';
import { tokens } from './tokens';

export const brandScaleSteps = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  '950',
] as const;

export type BrandScaleStep = (typeof brandScaleSteps)[number];
export type BrandScale = Record<BrandScaleStep, string>;

const customerBrand = tokens.colors.brand satisfies BrandScale;

const hostBrand = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
} satisfies BrandScale;

const adminBrand = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
} satisfies BrandScale;

export const roleThemes = {
  customer: customerBrand,
  host: hostBrand,
  admin: adminBrand,
} as const;

export type RoleThemeKey = keyof typeof roleThemes;

export function hexToRgbChannels(hex: string): string {
  const normalized = hex.replace('#', '');

  if (normalized.length !== 6) {
    throw new Error(`Expected 6-digit hex color, received "${hex}"`);
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

export function applyRoleTheme(
  element: HTMLElement,
  role: RoleThemeKey,
): void {
  const palette = roleThemes[role];

  element.dataset.role = role;

  for (const step of brandScaleSteps) {
    element.style.setProperty(`--brand-${step}`, hexToRgbChannels(palette[step]));
  }

  syncDocumentFavicon(palette[500]);
}

export function resolveRoleThemeKey(
  role: string | undefined,
  isAuthenticated: boolean,
): RoleThemeKey {
  if (!isAuthenticated) {
    return 'customer';
  }

  if (role === 'host' || role === 'admin' || role === 'customer') {
    return role;
  }

  return 'customer';
}

/**
 * Theme for unauthenticated pages.
 * Customer login/signup and public marketing pages use pink; host/admin entry points use their role colors.
 */
export function resolvePathThemeKey(pathname: string): RoleThemeKey {
  if (
    pathname === '/host/login' ||
    pathname === '/host/signup' ||
    pathname.startsWith('/host/login/') ||
    pathname.startsWith('/host/signup/')
  ) {
    return 'host';
  }

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return 'admin';
  }

  return 'customer';
}
