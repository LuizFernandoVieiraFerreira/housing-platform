package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Amenity;
import com.housingplatform.properties.model.PropertySearchCriteria;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.PropertyImage;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.persistence.enums.RoomStatus;
import com.housingplatform.properties.dto.CreateRoomRequest;
import com.housingplatform.properties.dto.HostPropertyRequest;
import com.housingplatform.properties.mapper.PropertyMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
public class PropertyRepositoryImpl implements PropertyRepositoryCustom {

  @PersistenceContext private EntityManager entityManager;

  @Override
  public List<SearchPropertyRow> search(
      PropertySearchCriteria criteria, int limit, int offset) {
    return PropertySearchNativeQuery.execute(entityManager, criteria, limit, offset);
  }

  @Override
  public Optional<Property> findPublishedProperty(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select p from Property p
            where p.id = :propertyId
              and p.status = com.housingplatform.persistence.enums.PropertyStatus.published
              and p.deletedAt is null
            """,
            Property.class)
        .setParameter("propertyId", propertyId)
        .getResultStream()
        .findFirst();
  }

  public Optional<Property> findHostProperty(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select p from Property p
            where p.id = :propertyId and p.deletedAt is null
            """,
            Property.class)
        .setParameter("propertyId", propertyId)
        .getResultStream()
        .findFirst();
  }

  public List<PropertyImage> findPropertyImages(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select i from PropertyImage i
            where i.propertyId = :propertyId
            order by i.sortOrder
            """,
            PropertyImage.class)
        .setParameter("propertyId", propertyId)
        .getResultList();
  }

  public List<Room> findPropertyRooms(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select r from Room r
            where r.propertyId = :propertyId
            order by r.monthlyPriceKrw
            """,
            Room.class)
        .setParameter("propertyId", propertyId)
        .getResultList();
  }

  public List<Amenity> findPropertyAmenities(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select a from Amenity a
            join PropertyAmenity pa on pa.amenityId = a.id
            where pa.propertyId = :propertyId
            order by a.sortOrder
            """,
            Amenity.class)
        .setParameter("propertyId", propertyId)
        .getResultList();
  }

  public List<UUID> findPropertyAmenityIds(UUID propertyId) {
    return entityManager
        .createQuery(
            """
            select pa.amenityId from PropertyAmenity pa
            where pa.propertyId = :propertyId
            """,
            UUID.class)
        .setParameter("propertyId", propertyId)
        .getResultList();
  }

  public List<Amenity> findAllAmenities() {
    return entityManager
        .createQuery(
            """
            select a from Amenity a order by a.sortOrder
            """,
            Amenity.class)
        .getResultList();
  }

  public Optional<Coordinates> findPublishedCoordinates(UUID propertyId) {
    return findCoordinates(propertyId, true);
  }

  public Optional<Coordinates> findCoordinates(UUID propertyId) {
    return findCoordinates(propertyId, false);
  }

  private Optional<Coordinates> findCoordinates(UUID propertyId, boolean publishedOnly) {
    String statusClause = publishedOnly ? " and p.status = 'published' " : "";
    try {
      Object[] row =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select
                        extensions.st_y(p.location::extensions.geometry) as latitude,
                        extensions.st_x(p.location::extensions.geometry) as longitude
                      from public.properties p
                      where p.id = :propertyId
                        and p.deleted_at is null
                        and p.location is not null
                      """
                          + statusClause)
                  .setParameter("propertyId", propertyId)
                  .getSingleResult();
      return Optional.of(
          new Coordinates(((Number) row[0]).doubleValue(), ((Number) row[1]).doubleValue()));
    } catch (NoResultException exception) {
      return Optional.empty();
    }
  }

  public String findHostDisplayName(UUID hostId) {
    try {
      String displayName =
          (String)
              entityManager
                  .createNativeQuery(
                      """
                      select display_name
                      from public.hosts
                      where id = :hostId and deleted_at is null
                      """)
                  .setParameter("hostId", hostId)
                  .getSingleResult();
      return displayName == null || displayName.isBlank() ? "Host" : displayName;
    } catch (NoResultException exception) {
      return "Host";
    }
  }

  public UUID createProperty(UUID hostId, String slug, HostPropertyRequest request, List<String> tags) {
    UUID id =
        (UUID)
            entityManager
                .createNativeQuery(
                    """
                    insert into public.properties (
                      host_id, slug, status, country, title, description, property_type,
                      address_line1, address_line2, city, postal_code, district,
                      nearest_station_name, nearest_station_walk_min, booking_mode,
                      min_stay_nights, tags
                    ) values (
                      :hostId, :slug, 'draft', 'KR', :title, :description, cast(:propertyType as accommodation_type),
                      :addressLine1, :addressLine2, :city, :postalCode, :district,
                      :nearestStationName, :nearestStationWalkMin, cast(:bookingMode as booking_mode),
                      :minStayNights, cast(:tags as text[])
                    )
                    returning id
                    """)
                .setParameter("hostId", hostId)
                .setParameter("slug", slug)
                .setParameter("title", request.title())
                .setParameter("description", request.description())
                .setParameter("propertyType", request.propertyType().dbValue())
                .setParameter("addressLine1", request.addressLine1())
                .setParameter("addressLine2", request.addressLine2())
                .setParameter("city", request.city())
                .setParameter("postalCode", request.postalCode())
                .setParameter("district", request.district())
                .setParameter("nearestStationName", request.nearestStationName())
                .setParameter("nearestStationWalkMin", request.nearestStationWalkMin())
                .setParameter("bookingMode", request.bookingMode().name())
                .setParameter("minStayNights", request.minStayNights())
                .setParameter("tags", tags.toArray(String[]::new))
                .getSingleResult();
    entityManager.flush();
    return id;
  }

  public Property updateProperty(UUID propertyId, HostPropertyRequest request, List<String> tags) {
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.properties
                set title = :title,
                    description = :description,
                    property_type = cast(:propertyType as accommodation_type),
                    address_line1 = :addressLine1,
                    address_line2 = :addressLine2,
                    city = :city,
                    postal_code = :postalCode,
                    district = :district,
                    nearest_station_name = :nearestStationName,
                    nearest_station_walk_min = :nearestStationWalkMin,
                    booking_mode = cast(:bookingMode as booking_mode),
                    min_stay_nights = :minStayNights,
                    tags = cast(:tags as text[]),
                    updated_at = timezone('utc', now())
                where id = :propertyId and deleted_at is null
                """)
            .setParameter("title", request.title())
            .setParameter("description", request.description())
            .setParameter("propertyType", request.propertyType().dbValue())
            .setParameter("addressLine1", request.addressLine1())
            .setParameter("addressLine2", request.addressLine2())
            .setParameter("city", request.city())
            .setParameter("postalCode", request.postalCode())
            .setParameter("district", request.district())
            .setParameter("nearestStationName", request.nearestStationName())
            .setParameter("nearestStationWalkMin", request.nearestStationWalkMin())
            .setParameter("bookingMode", request.bookingMode().name())
            .setParameter("minStayNights", request.minStayNights())
            .setParameter("tags", tags.toArray(String[]::new))
            .setParameter("propertyId", propertyId)
            .executeUpdate();
    if (updated == 0) {
      return null;
    }
    entityManager.flush();
    return findHostProperty(propertyId).orElse(null);
  }

  public boolean setLocation(UUID propertyId, double latitude, double longitude) {
    try {
      entityManager
          .createNativeQuery(
              """
              update public.properties
              set location = extensions.st_setsrid(
                extensions.st_makepoint(:longitude, :latitude),
                4326
              )::extensions.geography
              where id = :propertyId
                and deleted_at is null
                and status in ('draft', 'pending_review')
              returning id
              """)
          .setParameter("propertyId", propertyId)
          .setParameter("latitude", latitude)
          .setParameter("longitude", longitude)
          .getSingleResult();
      entityManager.flush();
      return true;
    } catch (NoResultException exception) {
      return false;
    }
  }

  public int countAvailableRooms(UUID propertyId) {
    Number count =
        (Number)
            entityManager
                .createNativeQuery(
                    """
                    select count(*)
                    from public.rooms
                    where property_id = :propertyId
                      and deleted_at is null
                      and status = 'available'
                    """)
                .setParameter("propertyId", propertyId)
                .getSingleResult();
    return count.intValue();
  }

  public boolean hasLocation(UUID propertyId) {
    Number count =
        (Number)
            entityManager
                .createNativeQuery(
                    """
                    select count(*)
                    from public.properties
                    where id = :propertyId and location is not null
                    """)
                .setParameter("propertyId", propertyId)
                .getSingleResult();
    return count.intValue() > 0;
  }

  public Property submitForReview(UUID propertyId) {
    try {
      entityManager
          .createNativeQuery(
              """
              update public.properties
              set status = 'pending_review'
              where id = :propertyId
                and deleted_at is null
                and status = 'draft'
              returning id
              """)
          .setParameter("propertyId", propertyId)
          .getSingleResult();
      entityManager.flush();
      return findHostProperty(propertyId).orElse(null);
    } catch (NoResultException exception) {
      return null;
    }
  }

  public void syncAmenities(UUID propertyId, List<UUID> amenityIds) {
    entityManager
        .createNativeQuery(
            """
            delete from public.property_amenities where property_id = :propertyId
            """)
        .setParameter("propertyId", propertyId)
        .executeUpdate();

    if (amenityIds == null || amenityIds.isEmpty()) {
      return;
    }

    for (UUID amenityId : amenityIds) {
      entityManager
          .createNativeQuery(
              """
              insert into public.property_amenities (property_id, amenity_id)
              values (:propertyId, :amenityId)
              """)
          .setParameter("propertyId", propertyId)
          .setParameter("amenityId", amenityId)
          .executeUpdate();
    }
    entityManager.flush();
  }

  public HostRoomDtoRow createRoom(UUID propertyId, CreateRoomRequest request) {
    UUID roomId =
        (UUID)
            entityManager
                .createNativeQuery(
                    """
                    insert into public.rooms (
                      property_id, name, room_type, size_sqm, max_occupancy,
                      monthly_price_krw, status, available_from
                    ) values (
                      :propertyId, :name, :roomType, :sizeSqm, :maxOccupancy,
                      :monthlyPriceKrw, 'available', :availableFrom
                    )
                    returning id
                    """)
                .setParameter("propertyId", propertyId)
                .setParameter("name", request.name())
                .setParameter("roomType", PropertyMapper.roomTypeOrNull(request))
                .setParameter("sizeSqm", request.sizeSqm())
                .setParameter("maxOccupancy", request.maxOccupancy())
                .setParameter("monthlyPriceKrw", request.monthlyPriceKrw())
                .setParameter("availableFrom", request.availableFrom())
                .getSingleResult();
    entityManager.flush();
    return findRoomRow(roomId).orElseThrow();
  }

  public Optional<UUID> findRoomPropertyId(UUID roomId) {
    try {
      UUID propertyId =
          (UUID)
              entityManager
                  .createNativeQuery(
                      """
                      select property_id from public.rooms where id = :roomId
                      """)
                  .setParameter("roomId", roomId)
                  .getSingleResult();
      return Optional.of(propertyId);
    } catch (NoResultException exception) {
      return Optional.empty();
    }
  }

  public Optional<PropertyStatus> findPropertyStatus(UUID propertyId) {
    return findHostProperty(propertyId).map(Property::getStatus);
  }

  public boolean deleteRoom(UUID roomId) {
    int deleted =
        entityManager
            .createNativeQuery(
                """
                delete from public.rooms where id = :roomId
                """)
            .setParameter("roomId", roomId)
            .executeUpdate();
    entityManager.flush();
    return deleted > 0;
  }

  public Optional<HostRoomDtoRow> findRoomRow(UUID roomId) {
    try {
      Object[] row =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select id, name, room_type, size_sqm, max_occupancy,
                             monthly_price_krw, status, available_from
                      from public.rooms
                      where id = :roomId
                      """)
                  .setParameter("roomId", roomId)
                  .getSingleResult();
      return Optional.of(toHostRoomRow(row));
    } catch (NoResultException exception) {
      return Optional.empty();
    }
  }

  private HostRoomDtoRow toHostRoomRow(Object[] row) {
    return new HostRoomDtoRow(
        (UUID) row[0],
        (String) row[1],
        (String) row[2],
        row[3] == null ? null : new BigDecimal(row[3].toString()),
        ((Number) row[4]).intValue(),
        ((Number) row[5]).intValue(),
        RoomStatus.valueOf((String) row[6]),
        row[7] == null ? null : ((java.sql.Date) row[7]).toLocalDate());
  }

}
