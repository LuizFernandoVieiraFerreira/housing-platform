import type { UserRole } from './auth';

export interface ChannelBootProfile {
  name: string;
  email: string;
  role: UserRole;
  bookingIds: string[];
}

export interface ChannelBootResult {
  pluginKey: string | null;
  anonymous?: boolean;
  memberId?: string;
  memberHash?: string;
  profile?: ChannelBootProfile;
}
