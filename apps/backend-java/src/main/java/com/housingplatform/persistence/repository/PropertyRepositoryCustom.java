package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Amenity;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.PropertyImage;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.persistence.enums.RoomStatus;
import com.housingplatform.features.properties.dto.CreateRoomRequest;
import com.housingplatform.features.properties.dto.HostPropertyRequest;
import com.housingplatform.features.properties.model.PropertySearchCriteria;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PropertyRepositoryCustom {

  record SearchPropertyRow(
      UUID id,
      String title,
      String slug,
      AccommodationType propertyType,
      String district,
      String nearestStationName,
      int monthlyPriceMin,
      List<String> tags,
      String coverStoragePath,
      String coverAltText,
      double latitude,
      double longitude,
      Double distanceMeters,
      int totalCount) {}

  record Coordinates(double latitude, double longitude) {}

  record HostRoomDtoRow(
      UUID id,
      String name,
      String roomType,
      BigDecimal sizeSqm,
      int maxOccupancy,
      int monthlyPriceKrw,
      RoomStatus status,
      LocalDate availableFrom) {}

  List<SearchPropertyRow> search(PropertySearchCriteria criteria, int limit, int offset);

  Optional<Property> findPublishedProperty(UUID propertyId);

  Optional<Property> findHostProperty(UUID propertyId);

  List<PropertyImage> findPropertyImages(UUID propertyId);

  List<Room> findPropertyRooms(UUID propertyId);

  List<Amenity> findPropertyAmenities(UUID propertyId);

  List<UUID> findPropertyAmenityIds(UUID propertyId);

  List<Amenity> findAllAmenities();

  Optional<Coordinates> findPublishedCoordinates(UUID propertyId);

  Optional<Coordinates> findCoordinates(UUID propertyId);

  String findHostDisplayName(UUID hostId);

  UUID createProperty(UUID hostId, String slug, HostPropertyRequest request, List<String> tags);

  Property updateProperty(UUID propertyId, HostPropertyRequest request, List<String> tags);

  boolean setLocation(UUID propertyId, double latitude, double longitude);

  int countAvailableRooms(UUID propertyId);

  boolean hasLocation(UUID propertyId);

  Property submitForReview(UUID propertyId);

  void syncAmenities(UUID propertyId, List<UUID> amenityIds);

  HostRoomDtoRow createRoom(UUID propertyId, CreateRoomRequest request);

  Optional<UUID> findRoomPropertyId(UUID roomId);

  Optional<PropertyStatus> findPropertyStatus(UUID propertyId);

  boolean deleteRoom(UUID roomId);

  Optional<HostRoomDtoRow> findRoomRow(UUID roomId);

}
