package com.housingplatform.bookings;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.ConflictException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.stereotype.Repository;

@Repository
public class BookingRepository {

  @PersistenceContext private EntityManager entityManager;

  private final ObjectMapper objectMapper;

  public BookingRepository(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public record BookingInputs(
      UUID roomId,
      UUID propertyId,
      String bookingMode,
      int minStayNights,
      int monthlyPriceKrw,
      int maxOccupancy,
      int nights) {}

  public record BookingPrice(int rentKrw, int serviceFeeKrw, int totalKrw, String pricingVersion) {}

  public record BookingListRow(
      UUID id,
      UUID customerId,
      BookingStatus status,
      BookingType bookingType,
      LocalDate checkIn,
      LocalDate checkOut,
      int guestCount,
      OffsetDateTime holdExpiresAt,
      OffsetDateTime createdAt,
      String customerNotes,
      UUID propertyId,
      UUID roomId,
      String propertyTitle,
      String district,
      String roomName,
      int rentKrw,
      int serviceFeeKrw,
      int totalKrw,
      String pricingVersion) {}

  public BookingInputs validateBookingInputs(
      UUID roomId, LocalDate checkIn, LocalDate checkOut, int guestCount) {
    if (!checkOut.isAfter(checkIn)) {
      throw new BadRequestException("checkOut must be after checkIn");
    }
    if (guestCount <= 0) {
      throw new BadRequestException("guestCount must be positive");
    }

    Object[] roomRow;
    try {
      roomRow =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select r.id, r.property_id, r.max_occupancy, r.monthly_price_krw, r.available_from
                      from public.rooms r
                      where r.id = :roomId
                        and r.deleted_at is null
                        and r.status = 'available'
                      """)
                  .setParameter("roomId", roomId)
                  .getSingleResult();
    } catch (NoResultException exception) {
      throw new NotFoundException("Room is not available");
    }

    UUID resolvedRoomId = (UUID) roomRow[0];
    UUID propertyId = (UUID) roomRow[1];
    int maxOccupancy = ((Number) roomRow[2]).intValue();
    int monthlyPriceKrw = ((Number) roomRow[3]).intValue();
    LocalDate availableFrom = toLocalDate(roomRow[4]);

    Object[] propertyRow;
    try {
      propertyRow =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select p.id, p.booking_mode::text, p.min_stay_nights
                      from public.properties p
                      where p.id = :propertyId
                        and p.deleted_at is null
                        and p.status = 'published'
                      """)
                  .setParameter("propertyId", propertyId)
                  .getSingleResult();
    } catch (NoResultException exception) {
      throw new NotFoundException("Property is not published");
    }

    String bookingMode = (String) propertyRow[1];
    int minStayNights = ((Number) propertyRow[2]).intValue();
    int nights = (int) java.time.temporal.ChronoUnit.DAYS.between(checkIn, checkOut);

    if (nights < minStayNights) {
      throw new BadRequestException("Stay must be at least " + minStayNights + " nights");
    }
    if (guestCount > maxOccupancy) {
      throw new BadRequestException("Room supports up to " + maxOccupancy + " guests");
    }
    if (availableFrom != null && availableFrom.isAfter(checkIn)) {
      throw new BadRequestException("Room is not available from the selected check-in date");
    }

    return new BookingInputs(
        resolvedRoomId, propertyId, bookingMode, minStayNights, monthlyPriceKrw, maxOccupancy, nights);
  }

  public BookingPrice calculateBookingPrice(int monthlyPriceKrw, int nights) {
    try {
      Object[] row =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select rent_krw, service_fee_krw, total_krw, pricing_version
                      from public.calculate_booking_price(:monthlyPriceKrw, :nights)
                      """)
                  .setParameter("monthlyPriceKrw", monthlyPriceKrw)
                  .setParameter("nights", nights)
                  .getSingleResult();
      return new BookingPrice(
          ((Number) row[0]).intValue(),
          ((Number) row[1]).intValue(),
          ((Number) row[2]).intValue(),
          (String) row[3]);
    } catch (NoResultException exception) {
      throw new BadRequestException("Unable to calculate booking price");
    }
  }

  public boolean roomHasBookingConflict(UUID roomId, LocalDate checkIn, LocalDate checkOut) {
    Object result =
        entityManager
            .createNativeQuery(
                """
                select public.room_has_booking_conflict(:roomId, :checkIn, :checkOut)
                """)
            .setParameter("roomId", roomId)
            .setParameter("checkIn", checkIn)
            .setParameter("checkOut", checkOut)
            .getSingleResult();
    return Boolean.TRUE.equals(result);
  }

  public int getHoldTtlMinutes() {
    try {
      Number value =
          (Number)
              entityManager
                  .createNativeQuery(
                      """
                      select hold_ttl_minutes from public.platform_settings where id = 1
                      """)
                  .getSingleResult();
      return value.intValue();
    } catch (NoResultException exception) {
      throw new BadRequestException("Platform settings are not configured");
    }
  }

  public UUID createBookingHold(
      UUID customerId,
      BookingInputs inputs,
      LocalDate checkIn,
      LocalDate checkOut,
      int guestCount,
      String customerNotes,
      BookingPrice price) {
    int holdTtlMinutes = getHoldTtlMinutes();
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    String status;
    String bookingType;
    OffsetDateTime holdExpiresAt;
    if ("instant".equals(inputs.bookingMode())) {
      status = "pending_payment";
      bookingType = "instant";
      holdExpiresAt = now.plusMinutes(holdTtlMinutes);
    } else {
      status = "requested";
      bookingType = "request";
      holdExpiresAt = null;
    }

    UUID bookingId;
    try {
      bookingId =
          (UUID)
              entityManager
                  .createNativeQuery(
                      """
                      insert into public.bookings (
                        customer_id, room_id, property_id, check_in, check_out, guest_count,
                        status, booking_type, hold_expires_at, customer_notes
                      ) values (
                        :customerId, :roomId, :propertyId, :checkIn, :checkOut, :guestCount,
                        cast(:status as booking_status), cast(:bookingType as booking_type),
                        :holdExpiresAt, :customerNotes
                      )
                      returning id
                      """)
                  .setParameter("customerId", customerId)
                  .setParameter("roomId", inputs.roomId())
                  .setParameter("propertyId", inputs.propertyId())
                  .setParameter("checkIn", checkIn)
                  .setParameter("checkOut", checkOut)
                  .setParameter("guestCount", guestCount)
                  .setParameter("status", status)
                  .setParameter("bookingType", bookingType)
                  .setParameter("holdExpiresAt", holdExpiresAt)
                  .setParameter("customerNotes", customerNotes)
                  .getSingleResult();
    } catch (RuntimeException exception) {
      if (isOverlapConflict(exception)) {
        throw new ConflictException("Selected dates conflict with an existing booking hold");
      }
      throw exception;
    }

    try {
      String nightlyBreakdown = buildNightlyBreakdown(inputs, price);
      entityManager
          .createNativeQuery(
              """
              insert into public.booking_price_snapshots (
                booking_id, rent_krw, service_fee_krw, utilities_krw, total_krw,
                pricing_version, nightly_breakdown
              ) values (
                :bookingId, :rentKrw, :serviceFeeKrw, 0, :totalKrw,
                :pricingVersion, cast(:nightlyBreakdown as jsonb)
              )
              """)
          .setParameter("bookingId", bookingId)
          .setParameter("rentKrw", price.rentKrw())
          .setParameter("serviceFeeKrw", price.serviceFeeKrw())
          .setParameter("totalKrw", price.totalKrw())
          .setParameter("pricingVersion", price.pricingVersion())
          .setParameter("nightlyBreakdown", nightlyBreakdown)
          .executeUpdate();
      entityManager.flush();
    } catch (RuntimeException exception) {
      if (isOverlapConflict(exception)) {
        throw new ConflictException("Selected dates conflict with an existing booking hold");
      }
      throw exception;
    }

    return bookingId;
  }

  public List<BookingListRow> listCustomerBookings(UUID customerId) {
    return queryBookingListRows(
        """
        where b.customer_id = :customerId
        order by b.created_at desc
        """,
        Map.of("customerId", customerId));
  }

  public Optional<BookingListRow> findBookingDetailRow(UUID bookingId) {
    List<BookingListRow> rows =
        queryBookingListRows(
            """
            where b.id = :bookingId
            """,
            Map.of("bookingId", bookingId));
    return rows.stream().findFirst();
  }

  public Optional<Booking> findBooking(UUID bookingId) {
    return entityManager
        .createQuery(
            """
            select b from Booking b where b.id = :bookingId
            """,
            Booking.class)
        .setParameter("bookingId", bookingId)
        .getResultStream()
        .findFirst();
  }

  public Booking cancelBooking(UUID bookingId, UUID customerId) {
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.bookings
                set status = 'cancelled',
                    cancelled_at = timezone('utc', now()),
                    updated_at = timezone('utc', now())
                where id = :bookingId
                  and customer_id = :customerId
                  and status in ('requested', 'pending_payment')
                """)
            .setParameter("bookingId", bookingId)
            .setParameter("customerId", customerId)
            .executeUpdate();
    if (updated == 0) {
      return null;
    }
    entityManager.flush();
    return findBooking(bookingId).orElse(null);
  }

  public Booking approveBooking(UUID bookingId, UUID approvedBy) {
    Booking booking =
        findBooking(bookingId).orElse(null);
    if (booking == null || booking.getStatus() != BookingStatus.requested) {
      return null;
    }

    if (roomHasBookingConflict(booking.getRoomId(), booking.getCheckIn(), booking.getCheckOut())) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    int holdTtlMinutes = getHoldTtlMinutes();
    OffsetDateTime holdExpiresAt = OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(holdTtlMinutes);

    try {
      int updated =
          entityManager
              .createNativeQuery(
                  """
                  update public.bookings
                  set status = 'pending_payment',
                      hold_expires_at = :holdExpiresAt,
                      approved_at = timezone('utc', now()),
                      approved_by = :approvedBy,
                      updated_at = timezone('utc', now())
                  where id = :bookingId and status = 'requested'
                  """)
              .setParameter("bookingId", bookingId)
              .setParameter("holdExpiresAt", holdExpiresAt)
              .setParameter("approvedBy", approvedBy)
              .executeUpdate();
      if (updated == 0) {
        return null;
      }
      entityManager.flush();
    } catch (RuntimeException exception) {
      if (isOverlapConflict(exception)) {
        throw new ConflictException("Selected dates conflict with an existing booking hold");
      }
      throw exception;
    }

    return findBooking(bookingId).orElse(null);
  }

  public Booking rejectBooking(UUID bookingId) {
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.bookings
                set status = 'rejected',
                    updated_at = timezone('utc', now())
                where id = :bookingId and status = 'requested'
                """)
            .setParameter("bookingId", bookingId)
            .executeUpdate();
    if (updated == 0) {
      return null;
    }
    entityManager.flush();
    return findBooking(bookingId).orElse(null);
  }

  public void notifyBookingRequest(UUID bookingId) {
    entityManager
        .createNativeQuery(
            """
            select public.notify_booking_request(b)
            from public.bookings b
            where b.id = :bookingId
            """)
        .setParameter("bookingId", bookingId)
        .getSingleResult();
  }

  public void notifyBookingConfirmed(UUID bookingId) {
    entityManager
        .createNativeQuery(
            """
            select public.notify_booking_confirmed(b)
            from public.bookings b
            where b.id = :bookingId
            """)
        .setParameter("bookingId", bookingId)
        .getSingleResult();
  }

  public void notifyBookingRejected(UUID bookingId) {
    entityManager
        .createNativeQuery(
            """
            select public.notify_booking_rejected(b)
            from public.bookings b
            where b.id = :bookingId
            """)
        .setParameter("bookingId", bookingId)
        .getSingleResult();
  }

  @SuppressWarnings("unchecked")
  private List<BookingListRow> queryBookingListRows(String whereClause, Map<String, Object> params) {
    var query =
        entityManager.createNativeQuery(
            """
            select
              b.id,
              b.customer_id,
              b.status::text,
              b.booking_type::text,
              b.check_in,
              b.check_out,
              b.guest_count,
              b.hold_expires_at,
              b.created_at,
              b.customer_notes,
              b.property_id,
              b.room_id,
              p.title,
              p.district,
              r.name,
              s.rent_krw,
              s.service_fee_krw,
              s.total_krw,
              s.pricing_version
            from public.bookings b
            join public.properties p on p.id = b.property_id
            join public.rooms r on r.id = b.room_id
            join public.booking_price_snapshots s on s.booking_id = b.id
            """
                + whereClause);

    params.forEach(query::setParameter);
    List<Object[]> rows = query.getResultList();
    List<BookingListRow> results = new ArrayList<>();
    for (Object[] row : rows) {
      results.add(
          new BookingListRow(
              (UUID) row[0],
              (UUID) row[1],
              BookingStatus.valueOf((String) row[2]),
              BookingType.valueOf((String) row[3]),
              toLocalDate(row[4]),
              toLocalDate(row[5]),
              ((Number) row[6]).intValue(),
              (OffsetDateTime) row[7],
              (OffsetDateTime) row[8],
              (String) row[9],
              (UUID) row[10],
              (UUID) row[11],
              (String) row[12],
              (String) row[13],
              (String) row[14],
              ((Number) row[15]).intValue(),
              ((Number) row[16]).intValue(),
              ((Number) row[17]).intValue(),
              (String) row[18]));
    }
    return results;
  }

  private String buildNightlyBreakdown(BookingInputs inputs, BookingPrice price) {
    Map<String, Object> entry = new LinkedHashMap<>();
    entry.put("nights", inputs.nights());
    entry.put("monthly_price_krw", inputs.monthlyPriceKrw());
    entry.put("rent_krw", price.rentKrw());
    entry.put("service_fee_krw", price.serviceFeeKrw());
    try {
      return objectMapper.writeValueAsString(List.of(entry));
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Unable to serialize nightly breakdown", exception);
    }
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

  private static boolean isOverlapConflict(Throwable exception) {
    Throwable current = exception;
    while (current != null) {
      if (current instanceof ConstraintViolationException constraint) {
        String message = constraint.getSQLException().getMessage();
        if (message != null) {
          String lowered = message.toLowerCase();
          if (lowered.contains("bookings_no_overlap") || lowered.contains("exclusion")) {
            return true;
          }
        }
      }
      String message = current.getMessage();
      if (message != null) {
        String lowered = message.toLowerCase();
        if (lowered.contains("bookings_no_overlap") || lowered.contains("exclusion")) {
          return true;
        }
      }
      current = current.getCause();
    }
    return false;
  }
}
