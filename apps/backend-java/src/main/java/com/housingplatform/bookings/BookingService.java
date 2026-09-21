package com.housingplatform.bookings;

import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.ConflictException;
import com.housingplatform.auth.error.ForbiddenException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.bookings.dto.BookingDetail;
import com.housingplatform.bookings.dto.BookingDto;
import com.housingplatform.bookings.dto.BookingListItem;
import com.housingplatform.bookings.dto.BookingQuote;
import com.housingplatform.bookings.dto.BookingQuoteQuery;
import com.housingplatform.bookings.dto.CreateBookingRequest;
import com.housingplatform.bookings.mapper.BookingMapper;
import com.housingplatform.shared.RateLimitService;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

  private final BookingRepository bookingRepository;
  private final AuthorizationService authorizationService;
  private final RateLimitService rateLimitService;

  public BookingService(
      BookingRepository bookingRepository,
      AuthorizationService authorizationService,
      RateLimitService rateLimitService) {
    this.bookingRepository = bookingRepository;
    this.authorizationService = authorizationService;
    this.rateLimitService = rateLimitService;
  }

  @Transactional(readOnly = true)
  public BookingQuote quote(BookingQuoteQuery query, String rateLimitActor) {
    rateLimitService.assertRateLimit("quote:" + rateLimitActor, 60, 60);
    var inputs =
        bookingRepository.validateBookingInputs(
            query.roomId(), query.checkIn(), query.checkOut(), query.guestCount());
    var price = bookingRepository.calculateBookingPrice(inputs.monthlyPriceKrw(), inputs.nights());
    return BookingMapper.toQuote(inputs, price);
  }

  @Transactional(readOnly = true)
  public List<BookingListItem> listMyBookings(AuthenticatedUser user) {
    return bookingRepository.listCustomerBookings(user.id()).stream()
        .map(BookingMapper::toListItem)
        .toList();
  }

  @Transactional(readOnly = true)
  public BookingDetail getBookingDetail(AuthenticatedUser user, UUID bookingId) {
    var row =
        bookingRepository
            .findBookingDetailRow(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));
    requireBookingAccess(user, row.propertyId(), row.customerId());
    return BookingMapper.toDetail(row);
  }

  @Transactional
  public BookingDto createBookingHold(AuthenticatedUser user, CreateBookingRequest request) {
    rateLimitService.assertRateLimit("booking_hold:" + user.id(), 10, 60);

    var inputs =
        bookingRepository.validateBookingInputs(
            request.roomId(), request.checkIn(), request.checkOut(), request.guestCount());

    if (bookingRepository.roomHasBookingConflict(
        request.roomId(), request.checkIn(), request.checkOut())) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    var price = bookingRepository.calculateBookingPrice(inputs.monthlyPriceKrw(), inputs.nights());
    String customerNotes = request.customerNotes();
    if (customerNotes != null) {
      customerNotes = customerNotes.strip();
      if (customerNotes.isEmpty()) {
        customerNotes = null;
      }
    }

    UUID bookingId =
        bookingRepository.createBookingHold(
            user.id(),
            inputs,
            request.checkIn(),
            request.checkOut(),
            request.guestCount(),
            customerNotes,
            price);

    if ("request".equals(inputs.bookingMode())) {
      bookingRepository.notifyBookingRequest(bookingId);
    }

    return BookingMapper.toBooking(
        bookingRepository.findBooking(bookingId).orElseThrow());
  }

  @Transactional
  public BookingDto cancelBooking(AuthenticatedUser user, UUID bookingId) {
    var booking =
        bookingRepository
            .findBooking(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));

    if (!booking.getCustomerId().equals(user.id())) {
      throw new ForbiddenException("Cannot cancel this booking");
    }

    var cancelled = bookingRepository.cancelBooking(bookingId, user.id());
    if (cancelled == null) {
      throw new BadRequestException("Booking cannot be cancelled");
    }
    return BookingMapper.toBooking(cancelled);
  }

  @Transactional
  public BookingDto approveBooking(AuthenticatedUser user, UUID bookingId) {
    bookingRepository
        .findBooking(bookingId)
        .orElseThrow(() -> new NotFoundException("Booking not found"));

    authorizationService.requireHostOfBooking(user, bookingId);

    var approved = bookingRepository.approveBooking(bookingId, user.id());
    if (approved == null) {
      throw new BadRequestException("Booking must be in requested status to approve");
    }

    bookingRepository.notifyBookingConfirmed(bookingId);
    return BookingMapper.toBooking(approved);
  }

  @Transactional
  public BookingDto rejectBooking(AuthenticatedUser user, UUID bookingId) {
    bookingRepository
        .findBooking(bookingId)
        .orElseThrow(() -> new NotFoundException("Booking not found"));

    authorizationService.requireHostOfBooking(user, bookingId);

    var rejected = bookingRepository.rejectBooking(bookingId);
    if (rejected == null) {
      throw new BadRequestException("Booking must be in requested status to reject");
    }

    bookingRepository.notifyBookingRejected(bookingId);
    return BookingMapper.toBooking(rejected);
  }

  private void requireBookingAccess(AuthenticatedUser user, UUID propertyId, UUID customerId) {
    if (customerId.equals(user.id())) {
      return;
    }
    if (authorizationService.isAdmin(user.id())) {
      return;
    }
    if (authorizationService.isHostOfProperty(user.id(), propertyId)) {
      return;
    }
    throw new ForbiddenException("Booking not found");
  }
}
