import type { profiles, user_role } from '@prisma/client';

import { UserRole } from '../../../shared/auth/auth-user.model';
import { formatDateTime } from '../../bookings/mappers/booking.mapper';
import type { ProfileDto } from '../dto/profile.dto';

function toUserRole(role: user_role): UserRole {
  switch (role) {
    case 'admin':
      return UserRole.Admin;
    case 'host':
      return UserRole.Host;
    default:
      return UserRole.Customer;
  }
}

export function mapProfile(profile: profiles): ProfileDto {
  return {
    id: profile.id,
    role: toUserRole(profile.role),
    fullName: profile.full_name,
    phone: profile.phone,
    avatarUrl: profile.avatar_url,
    preferredLanguage: profile.preferred_language,
    marketingConsent: profile.marketing_consent,
    createdAt: formatDateTime(profile.created_at),
    updatedAt: formatDateTime(profile.updated_at),
  };
}
