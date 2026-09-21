package com.housingplatform.admin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.entity.HousingRequest;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import com.housingplatform.persistence.enums.HousingRequestStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class AdminRepository {

  private static final int AUDIT_LOG_LIMIT = 100;

  @PersistenceContext private EntityManager entityManager;

  private final ObjectMapper objectMapper;

  public AdminRepository(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public record AdminPropertyRow(
      UUID id,
      String title,
      String slug,
      String propertyType,
      String district,
      String status,
      String bookingMode,
      Integer monthlyPriceMin,
      int roomCount,
      OffsetDateTime updatedAt,
      String hostDisplayName) {}

  public record AdminHostRow(
      UUID id,
      String displayName,
      String status,
      String profileName,
      OffsetDateTime verifiedAt,
      OffsetDateTime createdAt) {}

  public record AdminBookingRow(
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

  public record AdminPaymentRow(
      UUID id,
      UUID orderId,
      UUID bookingId,
      int amountKrw,
      String status,
      String propertyTitle,
      String customerName,
      OffsetDateTime confirmedAt,
      OffsetDateTime createdAt) {}

  public record HousingRequestRow(
      UUID id,
      String email,
      String desiredArea,
      LocalDate checkIn,
      LocalDate checkOut,
      Integer budgetMax,
      String accommodationType,
      String notes,
      String status,
      OffsetDateTime createdAt) {}

  public record AuditLogRow(
      UUID id,
      String action,
      String entityType,
      UUID entityId,
      Map<String, Object> metadata,
      OffsetDateTime createdAt,
      String actorName) {}

  public Map<String, Integer> getDashboardStats() {
    Map<String, Integer> stats = new LinkedHashMap<>();
    stats.put("pendingProperties", countPendingProperties());
    stats.put("pendingHosts", countPendingHosts());
    stats.put("openBookings", countOpenBookings());
    stats.put("openHousingRequests", countOpenHousingRequests());
    return stats;
  }

  @SuppressWarnings("unchecked")
  public List<AdminPropertyRow> listProperties() {
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
                  p.updated_at,
                  h.display_name
                from public.properties p
                join public.hosts h on h.id = p.host_id
                where p.deleted_at is null
                order by p.updated_at desc
                """)
            .getResultList();

    List<AdminPropertyRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new AdminPropertyRow(
              (UUID) row[0],
              (String) row[1],
              (String) row[2],
              (String) row[3],
              (String) row[4],
              (String) row[5],
              (String) row[6],
              row[7] == null ? null : ((Number) row[7]).intValue(),
              ((Number) row[8]).intValue(),
              (OffsetDateTime) row[9],
              (String) row[10]));
    }
    return results;
  }

  public Property publishProperty(UUID propertyId) {
    try {
      entityManager
          .createNativeQuery(
              """
              update public.properties
              set status = 'published',
                  published_at = timezone('utc', now())
              where id = :propertyId
                and deleted_at is null
                and status = 'pending_review'
              returning id
              """)
          .setParameter("propertyId", propertyId)
          .getSingleResult();
      entityManager.flush();
      return findProperty(propertyId).orElse(null);
    } catch (NoResultException exception) {
      return null;
    }
  }

  public Property rejectPropertyReview(UUID propertyId) {
    try {
      entityManager
          .createNativeQuery(
              """
              update public.properties
              set status = 'draft'
              where id = :propertyId
                and deleted_at is null
                and status = 'pending_review'
              returning id
              """)
          .setParameter("propertyId", propertyId)
          .getSingleResult();
      entityManager.flush();
      return findProperty(propertyId).orElse(null);
    } catch (NoResultException exception) {
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  public List<AdminHostRow> listHosts() {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  h.id,
                  h.display_name,
                  h.status::text,
                  p.full_name,
                  h.verified_at,
                  h.created_at
                from public.hosts h
                join public.profiles p on p.id = h.profile_id
                where h.deleted_at is null
                order by h.created_at desc
                """)
            .getResultList();

    List<AdminHostRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new AdminHostRow(
              (UUID) row[0],
              (String) row[1],
              (String) row[2],
              (String) row[3],
              (OffsetDateTime) row[4],
              (OffsetDateTime) row[5]));
    }
    return results;
  }

  public Host approveHost(UUID hostId) {
    try {
      entityManager
          .createNativeQuery(
              """
              update public.hosts
              set status = 'active',
                  verified_at = timezone('utc', now())
              where id = :hostId
                and deleted_at is null
                and status = 'pending'
              returning id
              """)
          .setParameter("hostId", hostId)
          .getSingleResult();
      entityManager.flush();
      return findHost(hostId).orElse(null);
    } catch (NoResultException exception) {
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  public List<AdminBookingRow> listBookings() {
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
                order by b.created_at desc
                """)
            .getResultList();

    List<AdminBookingRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new AdminBookingRow(
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

  @SuppressWarnings("unchecked")
  public List<AdminPaymentRow> listPayments() {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  pay.id,
                  pay.order_id,
                  pay.booking_id,
                  pay.amount_krw,
                  pay.status::text,
                  pay.confirmed_at,
                  pay.created_at,
                  prop.title,
                  prof.full_name
                from public.payments pay
                join public.bookings b on b.id = pay.booking_id
                join public.properties prop on prop.id = b.property_id
                join public.profiles prof on prof.id = pay.customer_id
                order by pay.created_at desc
                """)
            .getResultList();

    List<AdminPaymentRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new AdminPaymentRow(
              (UUID) row[0],
              (UUID) row[1],
              (UUID) row[2],
              ((Number) row[3]).intValue(),
              (String) row[4],
              (String) row[7],
              (String) row[8],
              (OffsetDateTime) row[5],
              (OffsetDateTime) row[6]));
    }
    return results;
  }

  @SuppressWarnings("unchecked")
  public List<HousingRequestRow> listHousingRequests() {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  id,
                  email,
                  desired_area,
                  check_in,
                  check_out,
                  budget_max,
                  accommodation_type::text,
                  notes,
                  status::text,
                  created_at
                from public.housing_requests
                order by created_at desc
                """)
            .getResultList();

    List<HousingRequestRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new HousingRequestRow(
              (UUID) row[0],
              (String) row[1],
              (String) row[2],
              toLocalDate(row[3]),
              toLocalDate(row[4]),
              row[5] == null ? null : ((Number) row[5]).intValue(),
              (String) row[6],
              (String) row[7],
              (String) row[8],
              (OffsetDateTime) row[9]));
    }
    return results;
  }

  public HousingRequest updateHousingRequestStatus(UUID requestId, HousingRequestStatus status) {
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.housing_requests
                set status = cast(:status as housing_request_status),
                    updated_at = timezone('utc', now())
                where id = :requestId
                """)
            .setParameter("status", status.dbValue())
            .setParameter("requestId", requestId)
            .executeUpdate();
    if (updated == 0) {
      return null;
    }
    entityManager.flush();
    return findHousingRequest(requestId).orElse(null);
  }

  @SuppressWarnings("unchecked")
  public List<AuditLogRow> listAuditLogs() {
    List<Object[]> rows =
        entityManager
            .createNativeQuery(
                """
                select
                  a.id,
                  a.action,
                  a.entity_type,
                  a.entity_id,
                  a.metadata,
                  a.created_at,
                  p.full_name
                from public.audit_logs a
                join public.profiles p on p.id = a.actor_id
                order by a.created_at desc
                limit :limit
                """)
            .setParameter("limit", AUDIT_LOG_LIMIT)
            .getResultList();

    List<AuditLogRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new AuditLogRow(
              (UUID) row[0],
              (String) row[1],
              (String) row[2],
              (UUID) row[3],
              parseMetadata(row[4]),
              (OffsetDateTime) row[5],
              (String) row[6]));
    }
    return results;
  }

  public void writeAuditLog(
      UUID actorId, String action, String entityType, UUID entityId, Map<String, Object> metadata) {
    try {
      entityManager
          .createNativeQuery(
              """
              insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
              values (:actorId, :action, :entityType, :entityId, cast(:metadata as jsonb))
              """)
          .setParameter("actorId", actorId)
          .setParameter("action", action.strip())
          .setParameter("entityType", entityType.strip())
          .setParameter("entityId", entityId)
          .setParameter("metadata", objectMapper.writeValueAsString(metadata == null ? Map.of() : metadata))
          .executeUpdate();
      entityManager.flush();
    } catch (Exception exception) {
      throw new IllegalStateException("Unable to write audit log", exception);
    }
  }

  private int countPendingProperties() {
    return scalarCount(
        """
        select count(*) from public.properties
        where status = 'pending_review' and deleted_at is null
        """);
  }

  private int countPendingHosts() {
    return scalarCount(
        """
        select count(*) from public.hosts
        where status = 'pending' and deleted_at is null
        """);
  }

  private int countOpenBookings() {
    return scalarCount(
        """
        select count(*) from public.bookings
        where status in ('requested', 'pending_payment', 'payment_failed')
        """);
  }

  private int countOpenHousingRequests() {
    return scalarCount(
        """
        select count(*) from public.housing_requests
        where status in ('new', 'in_progress')
        """);
  }

  private int scalarCount(String sql) {
    Number count = (Number) entityManager.createNativeQuery(sql).getSingleResult();
    return count.intValue();
  }

  private Optional<Property> findProperty(UUID propertyId) {
    return entityManager
        .createQuery("select p from Property p where p.id = :propertyId", Property.class)
        .setParameter("propertyId", propertyId)
        .getResultStream()
        .findFirst();
  }

  private Optional<Host> findHost(UUID hostId) {
    return entityManager
        .createQuery("select h from Host h where h.id = :hostId", Host.class)
        .setParameter("hostId", hostId)
        .getResultStream()
        .findFirst();
  }

  private Optional<HousingRequest> findHousingRequest(UUID requestId) {
    return entityManager
        .createQuery("select r from HousingRequest r where r.id = :requestId", HousingRequest.class)
        .setParameter("requestId", requestId)
        .getResultStream()
        .findFirst();
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> parseMetadata(Object value) {
    if (value == null) {
      return Map.of();
    }
    if (value instanceof Map<?, ?> map) {
      Map<String, Object> metadata = new LinkedHashMap<>();
      map.forEach((key, entry) -> metadata.put(String.valueOf(key), entry));
      return metadata;
    }
    if (value instanceof String json) {
      try {
        return objectMapper.readValue(json, new TypeReference<>() {});
      } catch (Exception exception) {
        return Map.of();
      }
    }
    return Map.of();
  }

  private static LocalDate toLocalDate(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof LocalDate localDate) {
      return localDate;
    }
    if (value instanceof java.sql.Date sqlDate) {
      return sqlDate.toLocalDate();
    }
    return LocalDate.parse(value.toString());
  }
}
