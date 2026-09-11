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

/** Soft violet, in the vein of Reflectly's purple mindfulness palette. */
const photographerBrand = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
} satisfies BrandScale;

/** Honey-gold for agent-facing pages — softer than amber, closer to Alura's cozy yellow. */
const agentBrand = {
  50: '#fffdf5',
  100: '#fef9e8',
  200: '#fef0c3',
  300: '#fde496',
  400: '#fcd463',
  500: '#fdc14a',
  600: '#e0a832',
  700: '#b88728',
  800: '#946b20',
  900: '#78571a',
  950: '#45320f',
} satisfies BrandScale;

export const roleThemes = {
  customer: customerBrand,
  host: hostBrand,
  admin: adminBrand,
  photographer: photographerBrand,
  agent: agentBrand,
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

function isPathWithin(pathname: string, roots: string[]): boolean {
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

/**
 * Theme demanded by the URL itself, or undefined for paths that belong to no single role.
 * Those fall back to the signed-in portal mode.
 */
export function resolveExplicitPathThemeKey(pathname: string): RoleThemeKey | undefined {
  if (isPathWithin(pathname, ['/for-hosts', '/host/login', '/host/signup'])) {
    return 'host';
  }

  if (isPathWithin(pathname, ['/admin/login'])) {
    return 'admin';
  }

  if (isPathWithin(pathname, ['/for-photographers'])) {
    return 'photographer';
  }

  if (isPathWithin(pathname, ['/for-agents'])) {
    return 'agent';
  }

  return undefined;
}

/**
 * Theme for unauthenticated pages.
 * Customer login/signup and public marketing pages use pink; host/admin entry points use their role colors.
 */
export function resolvePathThemeKey(pathname: string): RoleThemeKey {
  return resolveExplicitPathThemeKey(pathname) ?? 'customer';
}
