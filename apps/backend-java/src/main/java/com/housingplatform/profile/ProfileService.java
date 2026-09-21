package com.housingplatform.profile;

import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.profile.dto.ProfileDto;
import com.housingplatform.profile.dto.UpdateProfileRequest;
import com.housingplatform.profile.mapper.ProfileMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

  private final ProfileRepository profileRepository;

  public ProfileService(ProfileRepository profileRepository) {
    this.profileRepository = profileRepository;
  }

  @Transactional(readOnly = true)
  public ProfileDto getProfile(AuthenticatedUser user) {
    return profileRepository
        .findById(user.id())
        .map(ProfileMapper::toDto)
        .orElseThrow(() -> new NotFoundException("Profile not found"));
  }

  @Transactional
  public ProfileDto updateProfile(AuthenticatedUser user, UpdateProfileRequest request) {
    String phone = request.phone() == null || request.phone().isBlank() ? null : request.phone().strip();
    String avatarUrl =
        request.avatarUrl() == null || request.avatarUrl().isBlank()
            ? null
            : request.avatarUrl().strip();
    var updated =
        profileRepository.update(
            user.id(),
            request.fullName().strip(),
            phone,
            request.preferredLanguage().strip(),
            request.marketingConsent(),
            avatarUrl);
    if (updated == null) {
      throw new NotFoundException("Profile not found");
    }
    return ProfileMapper.toDto(updated);
  }
}
