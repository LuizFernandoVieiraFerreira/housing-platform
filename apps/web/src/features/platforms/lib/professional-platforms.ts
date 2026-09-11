import { Camera, Handshake, House } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ProfessionalPlatformKey = 'host' | 'photographer' | 'agent';

export interface ProfessionalPlatform {
  key: ProfessionalPlatformKey;
  icon: LucideIcon;
  /** Public marketing page. The bare `/host` paths belong to the signed-in portals. */
  landingPath: string;
  /** Unset until the platform has its own login page; the landing page then collects interest instead. */
  loginPath?: string;
  signupPath?: string;
}

const platformsByKey = {
  host: {
    key: 'host',
    icon: House,
    landingPath: '/for-hosts',
    loginPath: '/host/login',
    signupPath: '/host/signup',
  },
  photographer: {
    key: 'photographer',
    icon: Camera,
    landingPath: '/for-photographers',
  },
  agent: {
    key: 'agent',
    icon: Handshake,
    landingPath: '/for-agents',
  },
} satisfies Record<ProfessionalPlatformKey, ProfessionalPlatform>;

export const professionalPlatforms: readonly ProfessionalPlatform[] = [
  platformsByKey.host,
  platformsByKey.photographer,
  platformsByKey.agent,
];

export function getProfessionalPlatform(key: ProfessionalPlatformKey): ProfessionalPlatform {
  return platformsByKey[key];
}

/** A platform whose sign-in surfaces exist, so the landing page can link straight into them. */
export interface OpenProfessionalPlatform extends ProfessionalPlatform {
  loginPath: string;
  signupPath: string;
}

export function isPlatformOpen(
  platform: ProfessionalPlatform,
): platform is OpenProfessionalPlatform {
  return Boolean(platform.loginPath && platform.signupPath);
}
