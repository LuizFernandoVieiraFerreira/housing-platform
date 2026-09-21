package com.housingplatform.properties;

import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.ForbiddenException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.properties.dto.CreateRoomRequest;
import com.housingplatform.properties.dto.CreatedId;
import com.housingplatform.properties.dto.HostPropertyDetail;
import com.housingplatform.properties.dto.HostPropertyRequest;
import com.housingplatform.properties.dto.HostRoomDto;
import com.housingplatform.properties.dto.PropertyAmenityDto;
import com.housingplatform.properties.dto.PropertyDetail;
import com.housingplatform.properties.dto.PropertySearchQuery;
import com.housingplatform.properties.dto.PropertySearchResult;
import com.housingplatform.properties.dto.PropertyStatusChange;
import com.housingplatform.properties.dto.SetPropertyLocationRequest;
import com.housingplatform.properties.mapper.PropertyMapper;
import com.housingplatform.shared.StorageUrlResolver;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropertyService {

  private final PropertyRepository propertyRepository;
  private final AuthorizationService authorizationService;
  private final StorageUrlResolver storageUrlResolver;

  public PropertyService(
      PropertyRepository propertyRepository,
      AuthorizationService authorizationService,
      StorageUrlResolver storageUrlResolver) {
    this.propertyRepository = propertyRepository;
    this.authorizationService = authorizationService;
    this.storageUrlResolver = storageUrlResolver;
  }

  @Transactional(readOnly = true)
  public PropertySearchResult search(PropertySearchQuery query) {
    validateSearchQuery(query);
    var rows =
        propertyRepository.search(
            propertyRepository.buildSearchFilters(query), query.limit(), query.offset());
    int totalCount = rows.isEmpty() ? 0 : rows.getFirst().totalCount();
    List<com.housingplatform.properties.dto.SearchPropertyCard> items =
        rows.stream()
            .map(row -> PropertyMapper.toSearchCard(row, storageUrlResolver))
            .toList();
    return new PropertySearchResult(items, totalCount);
  }

  @Transactional(readOnly = true)
  public PropertyDetail getPublishedProperty(UUID propertyId) {
    Property property =
        propertyRepository
            .findPublishedProperty(propertyId)
            .orElseThrow(() -> new NotFoundException("Property not found"));

    if (property.getMonthlyPriceMin() == null) {
      throw new NotFoundException("Property not found");
    }

    var coordinates = propertyRepository.findPublishedCoordinates(propertyId).orElse(null);
    var amenities = propertyRepository.findPropertyAmenities(propertyId);
    var images = propertyRepository.findPropertyImages(propertyId);
    var rooms = propertyRepository.findPropertyRooms(propertyId);
    String hostDisplayName = propertyRepository.findHostDisplayName(property.getHostId());

    return PropertyMapper.toPropertyDetail(
        property,
        hostDisplayName,
        coordinates == null ? null : coordinates.latitude(),
        coordinates == null ? null : coordinates.longitude(),
        images,
        rooms,
        amenities,
        storageUrlResolver);
  }

  @Transactional
  public CreatedId createProperty(AuthenticatedUser user, HostPropertyRequest request) {
    UUID hostId = requireHostId(user);
    String slug = PropertyMapper.createPropertySlug(request.title());
    List<String> tags = PropertyMapper.normalizeTags(request.tags());
    List<UUID> amenityIds = request.amenityIds() == null ? List.of() : request.amenityIds();

    UUID propertyId = propertyRepository.createProperty(hostId, slug, request, tags);
    applyLocationIfPresent(propertyId, request);
    propertyRepository.syncAmenities(propertyId, amenityIds);
    return new CreatedId(propertyId);
  }

  @Transactional
  public HostPropertyDetail updateProperty(
      AuthenticatedUser user, UUID propertyId, HostPropertyRequest request) {
    requireMutableProperty(user, propertyId);
    List<String> tags = PropertyMapper.normalizeTags(request.tags());
    List<UUID> amenityIds = request.amenityIds() == null ? List.of() : request.amenityIds();

    Property updated = propertyRepository.updateProperty(propertyId, request, tags);
    if (updated == null) {
      throw new NotFoundException("Property not found");
    }

    applyLocationIfPresent(propertyId, request);
    propertyRepository.syncAmenities(propertyId, amenityIds);
    return loadHostPropertyDetail(propertyId);
  }

  @Transactional
  public void setLocation(
      AuthenticatedUser user, UUID propertyId, SetPropertyLocationRequest request) {
    requireMutableProperty(user, propertyId);
    if (!propertyRepository.setLocation(propertyId, request.latitude(), request.longitude())) {
      throw new BadRequestException("Property location cannot be updated");
    }
  }

  @Transactional
  public PropertyStatusChange submitForReview(AuthenticatedUser user, UUID propertyId) {
    authorizationService.requireHostOfProperty(user, propertyId);
    Property property =
        propertyRepository
            .findHostProperty(propertyId)
            .orElseThrow(() -> new NotFoundException("Property not found"));

    if (property.getStatus() != PropertyStatus.draft) {
      throw new BadRequestException("Property must be in draft status to submit for review");
    }
    if (propertyRepository.countAvailableRooms(propertyId) == 0) {
      throw new BadRequestException("Add at least one available room before submitting");
    }
    if (!propertyRepository.hasLocation(propertyId)) {
      throw new BadRequestException("Geocode the property address before submitting");
    }

    Property updated = propertyRepository.submitForReview(propertyId);
    if (updated == null) {
      throw new BadRequestException("Property must be in draft status to submit for review");
    }
    return new PropertyStatusChange(updated.getId(), updated.getStatus());
  }

  @Transactional
  public HostRoomDto createRoom(AuthenticatedUser user, UUID propertyId, CreateRoomRequest request) {
    requireMutableProperty(user, propertyId);
    var row = propertyRepository.createRoom(propertyId, request);
    return PropertyMapper.toHostRoomFromRow(
        row.id(),
        row.name(),
        row.roomType(),
        row.sizeSqm(),
        row.maxOccupancy(),
        row.monthlyPriceKrw(),
        row.status(),
        row.availableFrom());
  }

  @Transactional
  public void deleteRoom(AuthenticatedUser user, UUID roomId) {
    UUID propertyId =
        propertyRepository
            .findRoomPropertyId(roomId)
            .orElseThrow(() -> new NotFoundException("Room not found"));

    if (!authorizationService.isHostOfProperty(user.id(), propertyId)
        && !authorizationService.isAdmin(user.id())) {
      throw new ForbiddenException("Only the host of this property can perform this action");
    }

    if (!propertyRepository.deleteRoom(roomId)) {
      throw new NotFoundException("Room not found");
    }
  }

  @Transactional(readOnly = true)
  public List<PropertyAmenityDto> listAmenities() {
    return propertyRepository.findAllAmenities().stream()
        .map(PropertyMapper::toAmenityDto)
        .toList();
  }

  private HostPropertyDetail loadHostPropertyDetail(UUID propertyId) {
    Property property =
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

  private UUID requireHostId(AuthenticatedUser user) {
    UUID hostId = authorizationService.getHostIdForProfile(user.id());
    if (hostId == null) {
      throw new ForbiddenException("Host profile is required before creating listings");
    }
    return hostId;
  }

  private Property requireMutableProperty(AuthenticatedUser user, UUID propertyId) {
    Property property =
        propertyRepository
            .findHostProperty(propertyId)
            .orElseThrow(() -> new NotFoundException("Property not found"));

    if (authorizationService.isAdmin(user.id())) {
      return property;
    }

    if (!authorizationService.isHostOfProperty(user.id(), propertyId)) {
      throw new ForbiddenException("Only the host of this property can perform this action");
    }

    if (property.getStatus() != PropertyStatus.draft
        && property.getStatus() != PropertyStatus.pending_review) {
      throw new BadRequestException("Property can only be updated while draft or pending review");
    }

    return property;
  }

  private void applyLocationIfPresent(UUID propertyId, HostPropertyRequest request) {
    if (request.latitude() == null || request.longitude() == null) {
      return;
    }
    if (!propertyRepository.setLocation(propertyId, request.latitude(), request.longitude())) {
      throw new BadRequestException("Property location cannot be updated");
    }
  }

  private static void validateSearchQuery(PropertySearchQuery query) {
    if (query.priceMin() != null
        && query.priceMax() != null
        && query.priceMax() < query.priceMin()) {
      throw new BadRequestException("priceMax must be greater than or equal to priceMin");
    }
    if (query.checkIn() != null
        && query.checkOut() != null
        && !query.checkOut().isAfter(query.checkIn())) {
      throw new BadRequestException("checkOut must be after checkIn");
    }
  }
}
