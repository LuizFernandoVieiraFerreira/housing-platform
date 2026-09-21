package com.housingplatform.properties.mapper;

import com.housingplatform.persistence.entity.Amenity;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.PropertyImage;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.RoomStatus;
import com.housingplatform.properties.dto.CreateRoomRequest;
import com.housingplatform.properties.dto.HostPropertyDetail;
import com.housingplatform.properties.dto.HostPropertyRequest;
import com.housingplatform.properties.dto.HostRoomDto;
import com.housingplatform.properties.dto.PropertyAmenityDto;
import com.housingplatform.properties.dto.PropertyDetail;
import com.housingplatform.properties.dto.PropertyImageDto;
import com.housingplatform.properties.dto.PropertyRoomDto;
import com.housingplatform.properties.dto.SearchPropertyCard;
import com.housingplatform.persistence.repository.PropertyRepositoryCustom.Coordinates;
import com.housingplatform.persistence.repository.PropertyRepositoryCustom.SearchPropertyRow;
import com.housingplatform.shared.StorageUrlResolver;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

public final class PropertyMapper {

  private static final Pattern SLUG_SANITIZER = Pattern.compile("[^a-z0-9]+");

  private PropertyMapper() {}

  public static String createPropertySlug(String title) {
    String base = SLUG_SANITIZER.matcher(title.toLowerCase()).replaceAll("-").replaceAll("^-|-$", "");
    if (base.isBlank()) {
      base = "listing";
    }
    return base + "-" + UUID.randomUUID().toString().substring(0, 8);
  }

  public static List<String> normalizeTags(List<String> tags) {
    if (tags == null) {
      return List.of();
    }
    List<String> normalized = new ArrayList<>();
    for (String tag : tags) {
      if (tag == null) {
        continue;
      }
      String trimmed = tag.strip();
      if (!trimmed.isEmpty()) {
        normalized.add(trimmed);
      }
    }
    return normalized.size() > 20 ? normalized.subList(0, 20) : normalized;
  }

  public static SearchPropertyCard toSearchCard(SearchPropertyRow row, StorageUrlResolver storage) {
    return new SearchPropertyCard(
        row.id(),
        row.title(),
        row.slug(),
        row.propertyType(),
        row.district(),
        row.nearestStationName(),
        row.monthlyPriceMin(),
        row.coverStoragePath() == null ? null : storage.resolvePropertyImageUrl(row.coverStoragePath()),
        row.coverAltText(),
        row.tags() == null ? List.of() : row.tags(),
        row.latitude(),
        row.longitude(),
        row.distanceMeters());
  }

  public static PropertyDetail toPropertyDetail(
      Property property,
      String hostDisplayName,
      Double latitude,
      Double longitude,
      List<PropertyImage> images,
      List<Room> rooms,
      List<Amenity> amenities,
      StorageUrlResolver storage) {
    return new PropertyDetail(
        property.getId(),
        property.getTitle(),
        property.getSlug(),
        property.getDescription(),
        property.getPropertyType(),
        property.getDistrict(),
        property.getNearestStationName(),
        property.getNearestStationWalkMin(),
        property.getAddressLine1(),
        property.getAddressLine2(),
        property.getCity(),
        property.getBookingMode(),
        property.getMinStayNights(),
        property.getMonthlyPriceMin() == null ? 0 : property.getMonthlyPriceMin(),
        property.getTags() == null ? List.of() : Arrays.asList(property.getTags()),
        hostDisplayName,
        latitude,
        longitude,
        toPropertyImages(images, storage),
        toPublishedRooms(rooms),
        toPropertyAmenities(amenities));
  }

  public static HostPropertyDetail toHostPropertyDetail(
      Property property,
      Double latitude,
      Double longitude,
      List<UUID> amenityIds,
      List<Room> rooms) {
    return new HostPropertyDetail(
        property.getId(),
        property.getTitle(),
        property.getSlug(),
        property.getDescription(),
        property.getPropertyType(),
        property.getAddressLine1(),
        property.getAddressLine2(),
        property.getCity(),
        property.getPostalCode(),
        property.getDistrict(),
        property.getNearestStationName(),
        property.getNearestStationWalkMin(),
        property.getStatus(),
        property.getBookingMode(),
        property.getMinStayNights(),
        property.getTags() == null ? List.of() : Arrays.asList(property.getTags()),
        latitude,
        longitude,
        amenityIds,
        toHostRooms(rooms));
  }

  public static HostRoomDto toHostRoom(Room room) {
    return new HostRoomDto(
        room.getId(),
        room.getName(),
        room.getRoomType(),
        room.getSizeSqm(),
        room.getMaxOccupancy(),
        room.getMonthlyPriceKrw(),
        room.getStatus(),
        room.getAvailableFrom());
  }

  public static HostRoomDto toHostRoomFromRow(
      UUID id,
      String name,
      String roomType,
      BigDecimal sizeSqm,
      int maxOccupancy,
      int monthlyPriceKrw,
      RoomStatus status,
      java.time.LocalDate availableFrom) {
    return new HostRoomDto(
        id, name, roomType, sizeSqm, maxOccupancy, monthlyPriceKrw, status, availableFrom);
  }

  private static List<PropertyImageDto> toPropertyImages(
      List<PropertyImage> images, StorageUrlResolver storage) {
    return images.stream()
        .sorted(
            Comparator.<PropertyImage>comparingInt(image -> image.isCover() ? 0 : 1)
                .thenComparingInt(PropertyImage::getSortOrder))
        .map(
            image ->
                new PropertyImageDto(
                    image.getId(),
                    image.getStoragePath(),
                    storage.resolvePropertyImageUrl(image.getStoragePath()),
                    image.getAltText(),
                    image.getSortOrder(),
                    image.isCover()))
        .toList();
  }

  private static List<PropertyRoomDto> toPublishedRooms(List<Room> rooms) {
    return rooms.stream()
        .filter(room -> room.getDeletedAt() == null && room.getStatus() == RoomStatus.available)
        .sorted(Comparator.comparingInt(Room::getMonthlyPriceKrw))
        .map(PropertyMapper::toPropertyRoom)
        .toList();
  }

  private static PropertyRoomDto toPropertyRoom(Room room) {
    return new PropertyRoomDto(
        room.getId(),
        room.getName(),
        room.getRoomType(),
        room.getSizeSqm(),
        room.getMaxOccupancy(),
        room.getMonthlyPriceKrw(),
        room.getStatus(),
        room.getAvailableFrom());
  }

  private static List<HostRoomDto> toHostRooms(List<Room> rooms) {
    return rooms.stream()
        .filter(room -> room.getDeletedAt() == null)
        .map(PropertyMapper::toHostRoom)
        .toList();
  }

  private static List<PropertyAmenityDto> toPropertyAmenities(List<Amenity> amenities) {
    return amenities.stream()
        .sorted(Comparator.comparingInt(Amenity::getSortOrder))
        .map(
            amenity ->
                new PropertyAmenityDto(
                    amenity.getId(), amenity.getSlug(), amenity.getName(), amenity.getIcon()))
        .toList();
  }

  public static PropertyAmenityDto toAmenityDto(Amenity amenity) {
    return new PropertyAmenityDto(
        amenity.getId(), amenity.getSlug(), amenity.getName(), amenity.getIcon());
  }

  public static String blankToNull(String value) {
    if (value == null || value.isBlank()) {
      return null;
    }
    return value.strip();
  }

  public static String roomTypeOrNull(CreateRoomRequest request) {
    return blankToNull(request.roomType());
  }
}
