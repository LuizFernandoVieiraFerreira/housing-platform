package com.housingplatform.payments;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.BookingExpiredException;
import com.housingplatform.auth.error.ForbiddenException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.error.PaymentAmountMismatchException;
import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.enums.PaymentStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.hibernate.exception.GenericJDBCException;
import org.springframework.stereotype.Repository;

@Repository
public class PaymentRepository {

  @PersistenceContext private EntityManager entityManager;

  private final ObjectMapper objectMapper;

  public PaymentRepository(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public record PaymentLookupRow(
      UUID id,
      UUID orderId,
      UUID bookingId,
      UUID customerId,
      int amountKrw,
      PaymentStatus status) {}

  public record PaymentOrderRow(
      UUID paymentId, UUID orderId, UUID bookingId, int amountKrw, String orderName) {}

  public Optional<PaymentLookupRow> findByOrderId(UUID orderId) {
    try {
      Object[] row =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select id, order_id, booking_id, customer_id, amount_krw, status::text
                      from public.payments
                      where order_id = :orderId
                      """)
                  .setParameter("orderId", orderId)
                  .getSingleResult();
      return Optional.of(
          new PaymentLookupRow(
              (UUID) row[0],
              (UUID) row[1],
              (UUID) row[2],
              (UUID) row[3],
              ((Number) row[4]).intValue(),
              PaymentStatus.valueOf((String) row[5])));
    } catch (NoResultException exception) {
      return Optional.empty();
    }
  }

  public PaymentOrderRow createPaymentOrder(UUID bookingId, UUID customerId) {
    lockBooking(bookingId);

    Object[] bookingRow;
    try {
      bookingRow =
          (Object[])
              entityManager
                  .createNativeQuery(
                      """
                      select customer_id, status::text, payment_retry_count, hold_expires_at, property_id
                      from public.bookings
                      where id = :bookingId
                      for update
                      """)
                  .setParameter("bookingId", bookingId)
                  .getSingleResult();
    } catch (NoResultException exception) {
      throw new ForbiddenException("Booking not found");
    }

    UUID bookingCustomerId = (UUID) bookingRow[0];
    String status = (String) bookingRow[1];
    int paymentRetryCount = ((Number) bookingRow[2]).intValue();
    OffsetDateTime holdExpiresAt = (OffsetDateTime) bookingRow[3];
    UUID propertyId = (UUID) bookingRow[4];

    if (!bookingCustomerId.equals(customerId)) {
      throw new ForbiddenException("Booking not found");
    }

    if ("payment_failed".equals(status)) {
      if (paymentRetryCount >= 1) {
        throw new BadRequestException("Payment retry limit reached");
      }
      int holdTtlMinutes = getHoldTtlMinutes();
      entityManager
          .createNativeQuery(
              """
              update public.bookings
              set status = 'pending_payment',
                  payment_retry_count = payment_retry_count + 1,
                  hold_expires_at = :holdExpiresAt,
                  updated_at = timezone('utc', now())
              where id = :bookingId
              """)
          .setParameter(
              "holdExpiresAt", OffsetDateTime.now(ZoneOffset.UTC).plusMinutes(holdTtlMinutes))
          .setParameter("bookingId", bookingId)
          .executeUpdate();
      entityManager.flush();
    } else if (!"pending_payment".equals(status)) {
      throw new ForbiddenException("Booking is not awaiting payment");
    }

    if (holdExpiresAt != null && !holdExpiresAt.isAfter(OffsetDateTime.now(ZoneOffset.UTC))) {
      entityManager
          .createNativeQuery(
              """
              update public.bookings
              set status = 'expired', updated_at = timezone('utc', now())
              where id = :bookingId
              """)
          .setParameter("bookingId", bookingId)
          .executeUpdate();
      entityManager.flush();
      throw new BookingExpiredException("Booking hold has expired");
    }

    Number totalKrw;
    try {
      totalKrw =
          (Number)
              entityManager
                  .createNativeQuery(
                      """
                      select total_krw
                      from public.booking_price_snapshots
                      where booking_id = :bookingId
                      """)
                  .setParameter("bookingId", bookingId)
                  .getSingleResult();
    } catch (NoResultException exception) {
      throw new BadRequestException("Booking price snapshot missing");
    }

    String propertyTitle;
    try {
      propertyTitle =
          (String)
              entityManager
                  .createNativeQuery(
                      """
                      select title from public.properties where id = :propertyId
                      """)
                  .setParameter("propertyId", propertyId)
                  .getSingleResult();
    } catch (NoResultException exception) {
      propertyTitle = null;
    }

    UUID orderId = UUID.randomUUID();
    UUID paymentId =
        (UUID)
            entityManager
                .createNativeQuery(
                    """
                    insert into public.payments (
                      order_id, booking_id, customer_id, amount_krw, status
                    ) values (
                      :orderId, :bookingId, :customerId, :amountKrw, 'pending'
                    )
                    returning id
                    """)
                .setParameter("orderId", orderId)
                .setParameter("bookingId", bookingId)
                .setParameter("customerId", customerId)
                .setParameter("amountKrw", totalKrw.intValue())
                .getSingleResult();
    entityManager.flush();

    return new PaymentOrderRow(
        paymentId,
        orderId,
        bookingId,
        totalKrw.intValue(),
        propertyTitle == null || propertyTitle.isBlank() ? "Housing Platform stay" : propertyTitle);
  }

  public Payment finalizeSuccessfulPayment(
      UUID orderId, String paymentKey, int amountKrw, Map<String, Object> tossResponse) {
    UUID paymentId = callPaymentRpc(
        """
        select id from public.finalize_successful_payment(
          :orderId, :paymentKey, :amountKrw, cast(:tossResponse as jsonb)
        )
        """,
        orderId,
        paymentKey,
        amountKrw,
        tossResponse);
    return findPayment(paymentId).orElseThrow(() -> new NotFoundException("Payment not found"));
  }

  public Payment markPaymentFailed(
      UUID orderId, String reason, Map<String, Object> tossResponse) {
    UUID paymentId =
        callPaymentRpc(
            """
            select id from public.mark_payment_failed(
              :orderId, :reason, cast(:tossResponse as jsonb)
            )
            """,
            orderId,
            null,
            0,
            tossResponse,
            reason);
    return findPayment(paymentId).orElseThrow(() -> new NotFoundException("Payment not found"));
  }

  public void recordPaymentEvent(
      String eventId,
      UUID paymentId,
      UUID bookingId,
      String eventType,
      Map<String, Object> payload) {
    try {
      entityManager
          .createNativeQuery(
              """
              select id from public.record_payment_event(
                :eventId, :paymentId, :bookingId, :eventType, cast(:payload as jsonb)
              )
              """)
          .setParameter("eventId", eventId)
          .setParameter("paymentId", paymentId)
          .setParameter("bookingId", bookingId)
          .setParameter("eventType", eventType)
          .setParameter("payload", objectMapper.writeValueAsString(payload))
          .getSingleResult();
    } catch (NoResultException exception) {
      throw new BadRequestException("Unable to record payment event");
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Unable to serialize payment event payload", exception);
    }
  }

  public RuntimeException mapFinalizeError(RuntimeException exception) {
    String message = extractSqlMessage(exception);
    String lowered = message.toLowerCase();
    if (lowered.contains("expired")) {
      return new BookingExpiredException(message);
    }
    if (lowered.contains("mismatch")) {
      return new PaymentAmountMismatchException(message);
    }
    if (lowered.contains("not found")) {
      return new NotFoundException(message);
    }
    return new BadRequestException(message);
  }

  private UUID callPaymentRpc(
      String sql,
      UUID orderId,
      String paymentKey,
      int amountKrw,
      Map<String, Object> tossResponse) {
    return callPaymentRpc(sql, orderId, paymentKey, amountKrw, tossResponse, null);
  }

  private UUID callPaymentRpc(
      String sql,
      UUID orderId,
      String paymentKey,
      int amountKrw,
      Map<String, Object> tossResponse,
      String reason) {
    try {
      var query =
          entityManager
              .createNativeQuery(sql)
              .setParameter("orderId", orderId)
              .setParameter("tossResponse", toJson(tossResponse));
      if (paymentKey != null) {
        query.setParameter("paymentKey", paymentKey);
      }
      if (reason != null) {
        query.setParameter("reason", reason);
      }
      if (sql.contains(":amountKrw")) {
        query.setParameter("amountKrw", amountKrw);
      }
      return (UUID) query.getSingleResult();
    } catch (NoResultException exception) {
      throw new NotFoundException("Payment not found");
    }
  }

  private Optional<Payment> findPayment(UUID paymentId) {
    return entityManager
        .createQuery("select p from Payment p where p.id = :paymentId", Payment.class)
        .setParameter("paymentId", paymentId)
        .getResultStream()
        .findFirst();
  }

  private void lockBooking(UUID bookingId) {
    entityManager
        .createNativeQuery("select 1 from public.bookings where id = :bookingId for update")
        .setParameter("bookingId", bookingId)
        .getSingleResult();
  }

  private int getHoldTtlMinutes() {
    Number value =
        (Number)
            entityManager
                .createNativeQuery(
                    "select hold_ttl_minutes from public.platform_settings where id = 1")
                .getSingleResult();
    return value.intValue();
  }

  private String toJson(Map<String, Object> value) {
    if (value == null) {
      return null;
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Unable to serialize JSON payload", exception);
    }
  }

  private static String extractSqlMessage(Throwable exception) {
    Throwable current = exception;
    while (current != null) {
      if (current instanceof GenericJDBCException generic && generic.getSQLException() != null) {
        return generic.getSQLException().getMessage();
      }
      if (current.getMessage() != null) {
        return current.getMessage();
      }
      current = current.getCause();
    }
    return "Payment processing failed";
  }
}
