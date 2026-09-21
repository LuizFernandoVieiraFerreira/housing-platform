package com.housingplatform.shared.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.housingplatform.shared.auth.error.ForbiddenException;
import com.housingplatform.shared.auth.error.UnauthenticatedException;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.shared.auth.support.TestProfiles;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.UserRole;
import com.housingplatform.persistence.repository.BookingRepository;
import com.housingplatform.persistence.repository.HostRepository;
import com.housingplatform.persistence.repository.ProfileRepository;
import com.housingplatform.persistence.repository.PropertyRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

  @Mock private ProfileRepository profileRepository;
  @Mock private HostRepository hostRepository;
  @Mock private PropertyRepository propertyRepository;
  @Mock private BookingRepository bookingRepository;

  private AuthorizationService authorizationService;

  @BeforeEach
  void setUp() {
    authorizationService =
        new AuthorizationService(
            profileRepository, hostRepository, propertyRepository, bookingRepository);
  }

  @Test
  void resolveAuthUserReturnsProfileRole() {
    UUID profileId = UUID.randomUUID();
    Profile profile = TestProfiles.active(profileId, UserRole.host);
    when(profileRepository.findActiveById(profileId)).thenReturn(Optional.of(profile));

    AuthenticatedUser user = authorizationService.resolveAuthUser(profileId, "host@example.com");

    assertThat(user.id()).isEqualTo(profileId);
    assertThat(user.email()).isEqualTo("host@example.com");
    assertThat(user.role()).isEqualTo(UserRole.host);
  }

  @Test
  void resolveAuthUserRejectsMissingProfile() {
    UUID profileId = UUID.randomUUID();
    when(profileRepository.findActiveById(profileId)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> authorizationService.resolveAuthUser(profileId, null))
        .isInstanceOf(UnauthenticatedException.class)
        .hasMessageContaining("profile not found");
  }

  @Test
  void isAdminChecksDeletedAt() {
    UUID userId = UUID.randomUUID();
    when(profileRepository.existsActiveByIdAndRole(userId, UserRole.admin)).thenReturn(true);

    assertThat(authorizationService.isAdmin(userId)).isTrue();
  }

  @Test
  void requireAdminRaisesForNonAdmin() {
    UUID userId = UUID.randomUUID();
    AuthenticatedUser user = new AuthenticatedUser(userId, "user@example.com", UserRole.customer);
    when(profileRepository.existsActiveByIdAndRole(userId, UserRole.admin)).thenReturn(false);

    assertThatThrownBy(() -> authorizationService.requireAdmin(user))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("Admin access required");
  }

  @Test
  void getHostIdForProfileReturnsScalar() {
    UUID profileId = UUID.randomUUID();
    UUID hostId = UUID.randomUUID();
    when(hostRepository.findHostIdByProfileId(profileId)).thenReturn(Optional.of(hostId));

    assertThat(authorizationService.getHostIdForProfile(profileId)).isEqualTo(hostId);
  }

  @Test
  void isHostOfPropertyUsesExistsQuery() {
    UUID userId = UUID.randomUUID();
    UUID propertyId = UUID.randomUUID();
    when(propertyRepository.existsForHostProfile(userId, propertyId)).thenReturn(true);

    assertThat(authorizationService.isHostOfProperty(userId, propertyId)).isTrue();
  }

  @Test
  void isHostOfBookingReturnsFalseWhenBookingMissing() {
    UUID bookingId = UUID.randomUUID();
    when(bookingRepository.findPropertyIdById(bookingId)).thenReturn(Optional.empty());

    assertThat(authorizationService.isHostOfBooking(UUID.randomUUID(), bookingId)).isFalse();
  }

  @Test
  void isHostOfBookingDelegatesToPropertyCheck() {
    UUID userId = UUID.randomUUID();
    UUID bookingId = UUID.randomUUID();
    UUID propertyId = UUID.randomUUID();
    when(bookingRepository.findPropertyIdById(bookingId)).thenReturn(Optional.of(propertyId));
    when(propertyRepository.existsForHostProfile(userId, propertyId)).thenReturn(true);

    assertThat(authorizationService.isHostOfBooking(userId, bookingId)).isTrue();
  }

  @Test
  void requireHostOfPropertyRaisesForNonHost() {
    UUID userId = UUID.randomUUID();
    UUID propertyId = UUID.randomUUID();
    AuthenticatedUser user = new AuthenticatedUser(userId, "user@example.com", UserRole.customer);
    when(propertyRepository.existsForHostProfile(userId, propertyId)).thenReturn(false);

    assertThatThrownBy(() -> authorizationService.requireHostOfProperty(user, propertyId))
        .isInstanceOf(ForbiddenException.class)
        .hasMessageContaining("host of this property");
  }

  @Test
  void requireHostOfBookingAllowsAdmin() {
    UUID adminId = UUID.randomUUID();
    AuthenticatedUser admin = new AuthenticatedUser(adminId, "admin@example.com", UserRole.admin);
    when(profileRepository.existsActiveByIdAndRole(adminId, UserRole.admin)).thenReturn(true);

    authorizationService.requireHostOfBooking(admin, UUID.randomUUID());
  }

}
