package com.housingplatform.auth.service;

import com.housingplatform.auth.error.ForbiddenException;
import com.housingplatform.auth.error.UnauthenticatedException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.UserRole;
import com.housingplatform.persistence.repository.BookingRepository;
import com.housingplatform.persistence.repository.HostRepository;
import com.housingplatform.persistence.repository.ProfileRepository;
import com.housingplatform.persistence.repository.PropertyRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthorizationService {

  private final ProfileRepository profileRepository;
  private final HostRepository hostRepository;
  private final PropertyRepository propertyRepository;
  private final BookingRepository bookingRepository;

  public AuthorizationService(
      ProfileRepository profileRepository,
      HostRepository hostRepository,
      PropertyRepository propertyRepository,
      BookingRepository bookingRepository) {
    this.profileRepository = profileRepository;
    this.hostRepository = hostRepository;
    this.propertyRepository = propertyRepository;
    this.bookingRepository = bookingRepository;
  }

  public AuthenticatedUser resolveAuthUser(UUID userId, String email) {
    Profile profile =
        profileRepository
            .findActiveById(userId)
            .orElseThrow(() -> new UnauthenticatedException("User profile not found"));

    return new AuthenticatedUser(profile.getId(), email, profile.getRole());
  }

  public boolean isAdmin(UUID userId) {
    return profileRepository.existsActiveByIdAndRole(userId, UserRole.admin);
  }

  public UUID getHostIdForProfile(UUID userId) {
    return hostRepository.findHostIdByProfileId(userId).orElse(null);
  }

  public boolean isHostOfProperty(UUID userId, UUID propertyId) {
    return propertyRepository.existsForHostProfile(userId, propertyId);
  }

  public boolean isHostOfBooking(UUID userId, UUID bookingId) {
    UUID propertyId = bookingRepository.findPropertyIdById(bookingId).orElse(null);
    if (propertyId == null) {
      return false;
    }
    return isHostOfProperty(userId, propertyId);
  }

  public void requireAdmin(AuthenticatedUser user) {
    if (!isAdmin(user.id())) {
      throw new ForbiddenException("Admin access required");
    }
  }

  public void requireHostOfProperty(AuthenticatedUser user, UUID propertyId) {
    if (!isHostOfProperty(user.id(), propertyId)) {
      throw new ForbiddenException("Only the host of this property can perform this action");
    }
  }

  public void requireHostOfBooking(AuthenticatedUser user, UUID bookingId) {
    if (!(isAdmin(user.id()) || isHostOfBooking(user.id(), bookingId))) {
      throw new ForbiddenException("Only the host of this booking can perform this action");
    }
  }
}
