package com.housingplatform.authorization;

import com.housingplatform.auth.service.AuthorizationService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
class AuthorizationTestConfig {

  @Bean
  AuthorizationService authorizationService(
      com.housingplatform.persistence.repository.ProfileRepository profileRepository,
      com.housingplatform.persistence.repository.HostRepository hostRepository,
      com.housingplatform.persistence.repository.PropertyRepository propertyRepository,
      com.housingplatform.persistence.repository.BookingRepository bookingRepository) {
    return new AuthorizationService(
        profileRepository, hostRepository, propertyRepository, bookingRepository);
  }
}
