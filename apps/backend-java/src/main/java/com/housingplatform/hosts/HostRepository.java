package com.housingplatform.hosts;

import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class HostRepository {

  @PersistenceContext private EntityManager entityManager;

  public record HostPropertyListRow(
      UUID id,
      String title,
      String slug,
      String propertyType,
      String district,
      String status,
      String bookingMode,
      Integer monthlyPriceMin,
      int roomCount,
      OffsetDateTime updatedAt) {}

  public record HostBookingRow(
      UUID id,
      BookingStatus status,
      BookingType bookingType,
      LocalDate checkIn,
      LocalDate checkOut,
      int guestCount,
      String customerNotes,
      String propertyTitle,
      String roomName,
      int totalKrw,
      OffsetDateTime createdAt) {}

  public Optional<Host> findByProfileId(UUID profileId) {
    return entityManager
        .createQuery(
            """
            select h from Host h
            where h.profileId = :profileId and h.deletedAt is null
            """,
            Host.class)
        .setParameter("profileId", profileId)
        .getResultStream()
        .findFirst();
  }

  public Host register(UUID profileId, String displayName) {
    Optional<Host> existing = findByProfileId(profileId);
    if (existing.isPresent()) {
      return existing.get();
    }

    entityManager
        .createNativeQuery("alter table public.profiles disable trigger profiles_protect_role")
        .executeUpdate();
    try {
      entityManager
          .createNativeQuery(
              """
              update public.profiles set role = 'host' where id = :profileId
              """)
          .setParameter("profileId", profileId)
          .executeUpdate();

      UUID hostId =
          (UUID)
              entityManager
                  .createNativeQuery(
                      """
                      insert into public.hosts (profile_id, display_name, status)
                      values (:profileId, :displayName, 'pending')
                      returning id
                      """)
                  .setParameter("profileId", profileId)
                  .setParameter("displayName", displayName.strip())
                  .getSingleResult();
      entityManager.flush();
      return findById(hostId).orElseThrow();
    } finally {
      entityManager
          .createNativeQuery("alter table public.profiles enable trigger profiles_protect_role")
          .executeUpdate();
    }
  }

  public Optional<Host> findById(UUID hostId) {
    return entityManager
        .createQuery("select h from Host h where h.id = :hostId", Host.class)
        .setParameter("hostId", hostId)
        .getResultStream()
        .findFirst();
  }

  @SuppressWarnings("unchecked")
  public List<HostPropertyListRow> listProperties(UUID hostId) {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  p.id,
                  p.title,
                  p.slug,
                  p.property_type::text,
                  p.district,
                  p.status::text,
                  p.booking_mode::text,
                  p.monthly_price_min,
                  coalesce(
                    (
                      select count(*)::integer
                      from public.rooms r
                      where r.property_id = p.id and r.deleted_at is null
                    ),
                    0
                  ),
                  p.updated_at
                from public.properties p
                where p.host_id = :hostId and p.deleted_at is null
                order by p.updated_at desc
                """)
            .setParameter("hostId", hostId)
            .getResultList();

    List<HostPropertyListRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new HostPropertyListRow(
              (UUID) row[0],
              (String) row[1],
              (String) row[2],
              (String) row[3],
              (String) row[4],
              (String) row[5],
              (String) row[6],
              row[7] == null ? null : ((Number) row[7]).intValue(),
              ((Number) row[8]).intValue(),
              (OffsetDateTime) row[9]));
    }
    return results;
  }

  public boolean propertyBelongsToHost(UUID hostId, UUID propertyId) {
    Number count =
        (Number)
            entityManager
                .createNativeQuery(
                    """
                    select count(*)
                    from public.properties
                    where id = :propertyId and host_id = :hostId and deleted_at is null
                    """)
                .setParameter("propertyId", propertyId)
                .setParameter("hostId", hostId)
                .getSingleResult();
    return count.intValue() > 0;
  }

  @SuppressWarnings("unchecked")
  public List<HostBookingRow> listBookings(UUID hostId) {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  b.id,
                  b.status::text,
                  b.booking_type::text,
                  b.check_in,
                  b.check_out,
                  b.guest_count,
                  b.customer_notes,
                  p.title,
                  r.name,
                  s.total_krw,
                  b.created_at
                from public.bookings b
                join public.properties p on p.id = b.property_id
                join public.rooms r on r.id = b.room_id
                join public.booking_price_snapshots s on s.booking_id = b.id
                where p.host_id = :hostId
                order by b.created_at desc
                """)
            .setParameter("hostId", hostId)
            .getResultList();

    List<HostBookingRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new HostBookingRow(
              (UUID) row[0],
              BookingStatus.valueOf((String) row[1]),
              BookingType.valueOf((String) row[2]),
              toLocalDate(row[3]),
              toLocalDate(row[4]),
              ((Number) row[5]).intValue(),
              (String) row[6],
              (String) row[7],
              (String) row[8],
              ((Number) row[9]).intValue(),
              (OffsetDateTime) row[10]));
    }
    return results;
  }

  private static LocalDate toLocalDate(Object value) {
    if (value instanceof LocalDate localDate) {
      return localDate;
    }
    if (value instanceof java.sql.Date sqlDate) {
      return sqlDate.toLocalDate();
    }
    return LocalDate.parse(value.toString());
  }
}
