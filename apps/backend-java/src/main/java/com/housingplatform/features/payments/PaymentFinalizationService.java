package com.housingplatform.features.payments;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.shared.auth.error.BookingExpiredException;
import com.housingplatform.shared.auth.error.NotFoundException;
import com.housingplatform.shared.auth.error.PaymentAmountMismatchException;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.entity.support.PaymentEventFactory;
import com.housingplatform.persistence.entity.support.PaymentFactory;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.PaymentStatus;
import com.housingplatform.persistence.repository.BookingRepository;
import com.housingplatform.persistence.repository.PaymentEventRepository;
import com.housingplatform.persistence.repository.PaymentRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentFinalizationService {

  private final PaymentRepository paymentRepository;
  private final BookingRepository bookingRepository;
  private final PaymentEventRepository paymentEventRepository;

  public PaymentFinalizationService(
      PaymentRepository paymentRepository,
      BookingRepository bookingRepository,
      PaymentEventRepository paymentEventRepository) {
    this.paymentRepository = paymentRepository;
    this.bookingRepository = bookingRepository;
    this.paymentEventRepository = paymentEventRepository;
  }

  @Transactional
  public Payment finalizeSuccessfulPayment(
      UUID orderId, String paymentKey, int amountKrw, Map<String, Object> tossResponse) {
    Payment payment =
        paymentRepository
            .findByOrderIdForUpdate(orderId)
            .orElseThrow(() -> new NotFoundException("Payment not found"));

    if (payment.getStatus() == PaymentStatus.confirmed) {
      return payment;
    }

    if (payment.getAmountKrw() != amountKrw) {
      throw new PaymentAmountMismatchException("Payment amount mismatch");
    }

    Booking booking =
        bookingRepository
            .findByIdForUpdate(payment.getBookingId())
            .orElseThrow(() -> new NotFoundException("Booking not found"));

    if (booking.getStatus() == BookingStatus.confirmed) {
      PaymentFactory.applyConfirmed(payment, paymentKey, tossResponse, true);
      return paymentRepository.save(payment);
    }

    if (booking.getStatus() != BookingStatus.pending_payment) {
      throw new BadRequestException("Booking is not awaiting payment");
    }

    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    if (booking.getHoldExpiresAt() != null && !booking.getHoldExpiresAt().isAfter(now)) {
      bookingRepository.expireHold(booking.getId());
      throw new BookingExpiredException("Booking hold has expired");
    }

    PaymentFactory.applyConfirmed(payment, paymentKey, tossResponse, false);
    paymentRepository.save(payment);
    bookingRepository.confirmFromPayment(booking.getId());
    return payment;
  }

  @Transactional
  public Payment markPaymentFailed(UUID orderId, String reason, Map<String, Object> tossResponse) {
    Payment payment =
        paymentRepository
            .findByOrderIdForUpdate(orderId)
            .orElseThrow(() -> new NotFoundException("Payment not found"));

    if (payment.getStatus() == PaymentStatus.confirmed) {
      return payment;
    }

    PaymentFactory.applyFailed(payment, reason, tossResponse);
    paymentRepository.save(payment);
    bookingRepository.markPaymentFailedFromPayment(payment.getBookingId());
    return payment;
  }

  @Transactional
  public void recordPaymentEvent(
      String eventId,
      UUID paymentId,
      UUID bookingId,
      String eventType,
      Map<String, Object> payload) {
    if (paymentEventRepository.existsByEventId(eventId)) {
      return;
    }

    Payment payment = paymentRepository.getReferenceById(paymentId);
    Booking booking = bookingRepository.getReferenceById(bookingId);
    var event =
        PaymentEventFactory.create(eventId, payment, booking, eventType, payload);
    try {
      paymentEventRepository.save(event);
    } catch (DataIntegrityViolationException exception) {
      // Concurrent webhook with the same event_id — equivalent to ON CONFLICT DO NOTHING.
    }
  }
}
