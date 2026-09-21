import { Injectable } from '@nestjs/common';
import type { profiles } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getById(profileId: string): Promise<profiles | null> {
    return this.prisma.profiles.findFirst({
      where: {
        id: profileId,
        deleted_at: null,
      },
    });
  }

  async update(
    profileId: string,
    data: {
      fullName: string;
      phone: string | null;
      preferredLanguage: string;
      marketingConsent: boolean;
      avatarUrl: string | null;
    },
  ): Promise<profiles | null> {
    const profile = await this.getById(profileId);
    if (!profile) {
      return null;
    }

    return this.prisma.profiles.update({
      where: { id: profileId },
      data: {
        full_name: data.fullName.trim(),
        phone: data.phone,
        preferred_language: data.preferredLanguage.trim(),
        marketing_consent: data.marketingConsent,
        avatar_url: data.avatarUrl,
        updated_at: new Date(),
      },
    });
  }
}
