package com.housingplatform.persistence.repository;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.shared.auth.error.BookingExpiredException;
import com.housingplatform.shared.auth.error.ForbiddenException;
import com.housingplatform.persistence.enums.PaymentStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

public class PaymentRepositoryImpl implements PaymentRepositoryCustom {

  @PersistenceContext private EntityManager entityManager;

  @Override
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

  @Override
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

}
