import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { NotFoundError } from '../../shared/errors';
import type { ProfileDto, UpdateProfileDto } from './dto';
import { mapProfile } from './mappers/profile.mapper';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(user: AuthUser): Promise<ProfileDto> {
    const profile = await this.repository.getById(user.id);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    return mapProfile(profile);
  }

  async updateProfile(
    user: AuthUser,
    request: UpdateProfileDto,
  ): Promise<ProfileDto> {
    const phone = request.phone?.trim() ? request.phone.trim() : null;
    const avatarUrl = request.avatarUrl?.trim()
      ? request.avatarUrl.trim()
      : null;

    const updated = await this.repository.update(user.id, {
      fullName: request.fullName,
      phone,
      preferredLanguage: request.preferredLanguage,
      marketingConsent: request.marketingConsent,
      avatarUrl,
    });

    if (!updated) {
      throw new NotFoundError('Profile not found');
    }

    return mapProfile(updated);
  }
}
