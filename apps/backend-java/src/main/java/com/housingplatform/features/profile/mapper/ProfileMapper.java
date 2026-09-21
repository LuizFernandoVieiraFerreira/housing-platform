package com.housingplatform.features.profile.mapper;

import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.features.profile.dto.ProfileDto;

public final class ProfileMapper {
  private ProfileMapper() {}

  public static ProfileDto toDto(Profile profile) {
    return new ProfileDto(
        profile.getId(),
        profile.getRole(),
        profile.getFullName(),
        profile.getPhone(),
        profile.getAvatarUrl(),
        profile.getPreferredLanguage(),
        profile.isMarketingConsent(),
        profile.getCreatedAt(),
        profile.getUpdatedAt());
  }
}
