import type { UserRole } from '../../../shared/auth/auth-user.model';

export interface ProfileDto {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  preferredLanguage: string;
  marketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDto {
  fullName: string;
  phone?: string | null;
  preferredLanguage: string;
  marketingConsent: boolean;
  avatarUrl?: string | null;
}
