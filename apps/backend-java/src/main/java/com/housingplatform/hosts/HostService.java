package com.housingplatform.hosts;

import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.ForbiddenException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.hosts.dto.HostBooking;
import com.housingplatform.hosts.dto.HostDto;
import com.housingplatform.hosts.dto.HostPropertyListItem;
import com.housingplatform.hosts.dto.RegisterHostRequest;
import com.housingplatform.hosts.mapper.HostMapper;
import com.housingplatform.persistence.repository.HostRepository;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.properties.dto.HostPropertyDetail;
import com.housingplatform.properties.mapper.PropertyMapper;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HostService {

  private final HostRepository hostRepository;
  private final PropertyRepository propertyRepository;
  private final AuthorizationService authorizationService;

  public HostService(
      HostRepository hostRepository,
      PropertyRepository propertyRepository,
      AuthorizationService authorizationService) {
    this.hostRepository = hostRepository;
    this.propertyRepository = propertyRepository;
    this.authorizationService = authorizationService;
  }

  @Transactional
  public HostDto register(AuthenticatedUser user, RegisterHostRequest request) {
    String displayName = request.displayName().strip();
    if (displayName.isEmpty()) {
      throw new BadRequestException("Display name is required");
    }
    return HostMapper.toDto(hostRepository.register(user.id(), displayName));
  }

  @Transactional(readOnly = true)
  public HostDto getCurrentHost(AuthenticatedUser user) {
    return hostRepository.findByProfileId(user.id()).map(HostMapper::toDto).orElse(null);
  }

  @Transactional(readOnly = true)
  public List<HostPropertyListItem> listProperties(AuthenticatedUser user) {
    UUID hostId = requireHostId(user);
    return hostRepository.listProperties(hostId).stream()
        .map(HostMapper::toPropertyListItem)
        .toList();
  }

  @Transactional(readOnly = true)
  public HostPropertyDetail getProperty(AuthenticatedUser user, UUID propertyId) {
    UUID hostId = requireHostId(user);
    if (!hostRepository.propertyBelongsToHost(hostId, propertyId)) {
      throw new NotFoundException("Property not found");
    }

    var property =
        propertyRepository
            .findHostProperty(propertyId)
            .orElseThrow(() -> new NotFoundException("Property not found"));
    var coordinates = propertyRepository.findCoordinates(propertyId).orElse(null);
    var amenityIds = propertyRepository.findPropertyAmenityIds(propertyId);
    var rooms = propertyRepository.findPropertyRooms(propertyId);

    return PropertyMapper.toHostPropertyDetail(
        property,
        coordinates == null ? null : coordinates.latitude(),
        coordinates == null ? null : coordinates.longitude(),
        amenityIds,
        rooms);
  }

  @Transactional(readOnly = true)
  public List<HostBooking> listBookings(AuthenticatedUser user) {
    UUID hostId = requireHostId(user);
    return hostRepository.listBookings(hostId).stream().map(HostMapper::toHostBooking).toList();
  }

  private UUID requireHostId(AuthenticatedUser user) {
    UUID hostId = authorizationService.getHostIdForProfile(user.id());
    if (hostId == null) {
      throw new ForbiddenException("Host profile is required");
    }
    return hostId;
  }
}
