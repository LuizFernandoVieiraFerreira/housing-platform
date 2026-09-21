package com.housingplatform.features.payments;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.shared.auth.error.BookingExpiredException;
import com.housingplatform.shared.auth.error.NotFoundException;
import com.housingplatform.shared.auth.error.PaymentAmountMismatchException;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.entity.support.PaymentFactory;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.PaymentStatus;
import com.housingplatform.persistence.repository.BookingRepository;
import com.housingplatform.persistence.repository.PaymentEventRepository;
import com.housingplatform.persistence.repository.PaymentRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentFinalizationServiceTest {

  @Mock private PaymentRepository paymentRepository;
  @Mock private BookingRepository bookingRepository;
  @Mock private PaymentEventRepository paymentEventRepository;

  @InjectMocks private PaymentFinalizationService service;

  private UUID orderId;
  private UUID bookingId;
  private Payment payment;
  private Booking booking;

  @BeforeEach
  void setUp() {
    orderId = UUID.randomUUID();
    bookingId = UUID.randomUUID();
    payment = PaymentFactory.pendingPayment(orderId, bookingId, 1_023_000);
    booking = org.mockito.Mockito.mock(Booking.class);
  }

  private void stubPendingBooking() {
    when(booking.getStatus()).thenReturn(BookingStatus.pending_payment);
    when(booking.getId()).thenReturn(bookingId);
    when(booking.getHoldExpiresAt())
        .thenReturn(OffsetDateTime.now(ZoneOffset.UTC).plusHours(1));
  }

  @Test
  void finalizeSuccessfulPaymentConfirmsPaymentAndBooking() {
    stubPendingBooking();
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));
    when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
    when(paymentRepository.save(payment)).thenAnswer(invocation -> invocation.getArgument(0));

    Map<String, Object> tossResponse = Map.of("status", "DONE");
    Payment result =
        service.finalizeSuccessfulPayment(orderId, "pay_key", 1_023_000, tossResponse);

    assertThat(result.getStatus()).isEqualTo(PaymentStatus.confirmed);
    assertThat(result.getPaymentKey()).isEqualTo("pay_key");
    verify(bookingRepository).confirmFromPayment(bookingId);
    verify(paymentRepository).save(payment);
  }

  @Test
  void finalizeSuccessfulPaymentIsIdempotentWhenAlreadyConfirmed() {
    Payment confirmed = PaymentFactory.pendingPayment(orderId, bookingId, 1_023_000);
    PaymentFactory.applyConfirmed(confirmed, "existing_key", Map.of(), false);
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(confirmed));

    Payment result =
        service.finalizeSuccessfulPayment(orderId, "pay_key", 1_023_000, Map.of("status", "DONE"));

    assertThat(result).isSameAs(confirmed);
    verify(bookingRepository, never()).findByIdForUpdate(any());
    verify(paymentRepository, never()).save(any());
  }

  @Test
  void finalizeSuccessfulPaymentRejectsAmountMismatch() {
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));

    assertThatThrownBy(
            () ->
                service.finalizeSuccessfulPayment(
                    orderId, "pay_key", 999_000, Map.of("status", "DONE")))
        .isInstanceOf(PaymentAmountMismatchException.class);
  }

  @Test
  void finalizeSuccessfulPaymentExpiresHoldWhenPastDue() {
    stubPendingBooking();
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));
    when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
    when(booking.getHoldExpiresAt())
        .thenReturn(OffsetDateTime.now(ZoneOffset.UTC).minusMinutes(1));

    assertThatThrownBy(
            () ->
                service.finalizeSuccessfulPayment(
                    orderId, "pay_key", 1_023_000, Map.of("status", "DONE")))
        .isInstanceOf(BookingExpiredException.class);

    verify(bookingRepository).expireHold(bookingId);
  }

  @Test
  void finalizeSuccessfulPaymentRejectsNonPendingBooking() {
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));
    when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
    when(booking.getStatus()).thenReturn(BookingStatus.requested);

    assertThatThrownBy(
            () ->
                service.finalizeSuccessfulPayment(
                    orderId, "pay_key", 1_023_000, Map.of("status", "DONE")))
        .isInstanceOf(BadRequestException.class)
        .hasMessageContaining("not awaiting payment");
  }

  @Test
  void finalizeSuccessfulPaymentUpdatesPaymentWhenBookingAlreadyConfirmed() {
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));
    when(bookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
    when(booking.getStatus()).thenReturn(BookingStatus.confirmed);
    when(paymentRepository.save(payment)).thenAnswer(invocation -> invocation.getArgument(0));

    service.finalizeSuccessfulPayment(orderId, "pay_key", 1_023_000, Map.of("status", "DONE"));

    assertThat(payment.getStatus()).isEqualTo(PaymentStatus.confirmed);
    verify(bookingRepository, never()).confirmFromPayment(bookingId);
    verify(paymentRepository).save(payment);
  }

  @Test
  void markPaymentFailedUpdatesPaymentAndBooking() {
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(payment));
    when(paymentRepository.save(payment)).thenAnswer(invocation -> invocation.getArgument(0));

    Payment result = service.markPaymentFailed(orderId, "Card declined", Map.of("status", "ABORTED"));

    assertThat(result.getStatus()).isEqualTo(PaymentStatus.failed);
    assertThat(result.getFailedReason()).isEqualTo("Card declined");
    verify(bookingRepository).markPaymentFailedFromPayment(bookingId);
  }

  @Test
  void markPaymentFailedIsNoOpWhenAlreadyConfirmed() {
    Payment confirmed = PaymentFactory.pendingPayment(orderId, bookingId, 1_023_000);
    PaymentFactory.applyConfirmed(confirmed, "pay_key", Map.of(), false);
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.of(confirmed));

    service.markPaymentFailed(orderId, "ignored", Map.of());

    verify(paymentRepository, never()).save(any());
    verify(bookingRepository, never()).markPaymentFailedFromPayment(any());
  }

  @Test
  void recordPaymentEventSkipsDuplicateEventId() {
    when(paymentEventRepository.existsByEventId("evt-1")).thenReturn(true);

    service.recordPaymentEvent(
        "evt-1", UUID.randomUUID(), UUID.randomUUID(), "PAYMENT_CONFIRMED", Map.of());

    verify(paymentEventRepository, never()).save(any());
  }

  @Test
  void finalizeSuccessfulPaymentThrowsWhenPaymentMissing() {
    when(paymentRepository.findByOrderIdForUpdate(orderId)).thenReturn(Optional.empty());

    assertThatThrownBy(
            () ->
                service.finalizeSuccessfulPayment(
                    orderId, "pay_key", 1_023_000, Map.of("status", "DONE")))
        .isInstanceOf(NotFoundException.class);
  }
}
