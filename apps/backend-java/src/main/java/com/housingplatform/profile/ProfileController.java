package com.housingplatform.profile;

import com.housingplatform.auth.AuthSupport;
import com.housingplatform.profile.dto.ProfileDto;
import com.housingplatform.profile.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/profile")
public class ProfileController {

  private final ProfileService profileService;

  public ProfileController(ProfileService profileService) {
    this.profileService = profileService;
  }

  @GetMapping
  public ProfileDto getProfile() {
    return profileService.getProfile(AuthSupport.requireCurrentUser());
  }

  @PatchMapping
  public ProfileDto updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
    return profileService.updateProfile(AuthSupport.requireCurrentUser(), request);
  }
}
