/**
 * Platforms feature constants.
 */

import { Camera, Handshake, House } from 'lucide-react';

import type { ProfessionalPlatform, ProfessionalPlatformKey } from './types';

/**
 * Platform configurations by key.
 */
export const PLATFORMS_BY_KEY: Record<ProfessionalPlatformKey, ProfessionalPlatform> = {
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
};

/**
 * All professional platforms in display order.
 */
export const PROFESSIONAL_PLATFORMS: readonly ProfessionalPlatform[] = [
  PLATFORMS_BY_KEY.host,
  PLATFORMS_BY_KEY.photographer,
  PLATFORMS_BY_KEY.agent,
];
