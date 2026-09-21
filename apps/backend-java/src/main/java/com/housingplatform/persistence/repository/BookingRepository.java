package com.housingplatform.persistence.repository;

import com.housingplatform.bookings.model.BookingListView;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.enums.BookingStatus;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT b FROM Booking b WHERE b.id = :id")
  Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

  @Query("SELECT b.propertyId FROM Booking b WHERE b.id = :id")
  Optional<UUID> findPropertyIdById(@Param("id") UUID id);

  @Query(
      """
      SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
      FROM Booking b
      WHERE b.roomId = :roomId
        AND b.status IN :activeStatuses
        AND b.checkIn < :checkOut
        AND b.checkOut > :checkIn
      """)
  boolean existsActiveConflict(
      @Param("roomId") UUID roomId,
      @Param("checkIn") LocalDate checkIn,
      @Param("checkOut") LocalDate checkOut,
      @Param("activeStatuses") Collection<BookingStatus> activeStatuses);

  @Query(
      """
      SELECT new com.housingplatform.bookings.model.BookingListView(
        b.id,
        b.customerId,
        b.status,
        b.bookingType,
        b.checkIn,
        b.checkOut,
        b.guestCount,
        b.holdExpiresAt,
        b.createdAt,
        b.customerNotes,
        b.propertyId,
        b.roomId,
        p.title,
        p.district,
        r.name,
        s.rentKrw,
        s.serviceFeeKrw,
        s.totalKrw,
        s.pricingVersion
      )
      FROM Booking b
      JOIN b.property p
      JOIN b.room r
      JOIN BookingPriceSnapshot s ON s.booking = b
      WHERE b.customerId = :customerId
      ORDER BY b.createdAt DESC
      """)
  List<BookingListView> findListViewsByCustomerId(@Param("customerId") UUID customerId);

  @Query(
      """
      SELECT new com.housingplatform.bookings.model.BookingListView(
        b.id,
        b.customerId,
        b.status,
        b.bookingType,
        b.checkIn,
        b.checkOut,
        b.guestCount,
        b.holdExpiresAt,
        b.createdAt,
        b.customerNotes,
        b.propertyId,
        b.roomId,
        p.title,
        p.district,
        r.name,
        s.rentKrw,
        s.serviceFeeKrw,
        s.totalKrw,
        s.pricingVersion
      )
      FROM Booking b
      JOIN b.property p
      JOIN b.room r
      JOIN BookingPriceSnapshot s ON s.booking = b
      WHERE b.id = :bookingId
      """)
  Optional<BookingListView> findListViewById(@Param("bookingId") UUID bookingId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.cancelled,
          b.cancelledAt = CURRENT_TIMESTAMP,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
        AND b.customerId = :customerId
        AND b.status IN (
          com.housingplatform.persistence.enums.BookingStatus.requested,
          com.housingplatform.persistence.enums.BookingStatus.pending_payment
        )
      """)
  int cancelByCustomer(@Param("bookingId") UUID bookingId, @Param("customerId") UUID customerId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.rejected,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
        AND b.status = com.housingplatform.persistence.enums.BookingStatus.requested
      """)
  int rejectRequestedBooking(@Param("bookingId") UUID bookingId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.pending_payment,
          b.holdExpiresAt = :holdExpiresAt,
          b.approvedAt = CURRENT_TIMESTAMP,
          b.approvedBy = :approver,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
        AND b.status = com.housingplatform.persistence.enums.BookingStatus.requested
      """)
  int approveRequestedBooking(
      @Param("bookingId") UUID bookingId,
      @Param("holdExpiresAt") java.time.OffsetDateTime holdExpiresAt,
      @Param("approver") com.housingplatform.persistence.entity.Profile approver);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.confirmed,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
      """)
  int confirmFromPayment(@Param("bookingId") UUID bookingId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.expired,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
      """)
  int expireHold(@Param("bookingId") UUID bookingId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Booking b
      SET b.status = com.housingplatform.persistence.enums.BookingStatus.payment_failed,
          b.updatedAt = CURRENT_TIMESTAMP
      WHERE b.id = :bookingId
        AND b.status IN (
          com.housingplatform.persistence.enums.BookingStatus.pending_payment,
          com.housingplatform.persistence.enums.BookingStatus.payment_failed
        )
      """)
  int markPaymentFailedFromPayment(@Param("bookingId") UUID bookingId);
}
