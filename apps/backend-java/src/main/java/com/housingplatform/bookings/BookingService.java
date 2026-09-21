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
import com.housingplatform.bookings.model.BookingInputs;
import com.housingplatform.bookings.model.BookingPrice;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.entity.support.BookingFactory;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import com.housingplatform.persistence.repository.BookingPriceSnapshotRepository;
import com.housingplatform.persistence.repository.BookingRepository;
import com.housingplatform.persistence.repository.ProfileRepository;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.persistence.repository.RoomRepository;
import com.housingplatform.shared.RateLimitService;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {

  private static final Set<BookingStatus> ACTIVE_CONFLICT_STATUSES =
      Set.of(BookingStatus.pending_payment, BookingStatus.confirmed, BookingStatus.active);

  private final BookingRepository bookingRepository;
  private final BookingPriceSnapshotRepository bookingPriceSnapshotRepository;
  private final RoomRepository roomRepository;
  private final PropertyRepository propertyRepository;
  private final ProfileRepository profileRepository;
  private final AuthorizationService authorizationService;
  private final RateLimitService rateLimitService;
  private final BookingValidationService bookingValidationService;
  private final BookingPricingService bookingPricingService;
  private final BookingNotificationService bookingNotificationService;

  public BookingService(
      BookingRepository bookingRepository,
      BookingPriceSnapshotRepository bookingPriceSnapshotRepository,
      RoomRepository roomRepository,
      PropertyRepository propertyRepository,
      ProfileRepository profileRepository,
      AuthorizationService authorizationService,
      RateLimitService rateLimitService,
      BookingValidationService bookingValidationService,
      BookingPricingService bookingPricingService,
      BookingNotificationService bookingNotificationService) {
    this.bookingRepository = bookingRepository;
    this.bookingPriceSnapshotRepository = bookingPriceSnapshotRepository;
    this.roomRepository = roomRepository;
    this.propertyRepository = propertyRepository;
    this.profileRepository = profileRepository;
    this.authorizationService = authorizationService;
    this.rateLimitService = rateLimitService;
    this.bookingValidationService = bookingValidationService;
    this.bookingPricingService = bookingPricingService;
    this.bookingNotificationService = bookingNotificationService;
  }

  @Transactional(readOnly = true)
  public BookingQuote quote(BookingQuoteQuery query, String rateLimitActor) {
    rateLimitService.assertRateLimit("quote:" + rateLimitActor, 60, 60);
    BookingInputs inputs =
        bookingValidationService.validateInputs(
            query.roomId(), query.checkIn(), query.checkOut(), query.guestCount());
    BookingPrice price =
        bookingPricingService.calculatePrice(inputs.monthlyPriceKrw(), inputs.nights());
    return BookingMapper.toQuote(inputs, price);
  }

  @Transactional(readOnly = true)
  public List<BookingListItem> listMyBookings(AuthenticatedUser user) {
    return bookingRepository.findListViewsByCustomerId(user.id()).stream()
        .map(BookingMapper::toListItem)
        .toList();
  }

  @Transactional(readOnly = true)
  public BookingDetail getBookingDetail(AuthenticatedUser user, UUID bookingId) {
    var row =
        bookingRepository
            .findListViewById(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));
    requireBookingAccess(user, row.propertyId(), row.customerId());
    return BookingMapper.toDetail(row);
  }

  @Transactional
  public BookingDto createBookingHold(AuthenticatedUser user, CreateBookingRequest request) {
    rateLimitService.assertRateLimit("booking_hold:" + user.id(), 10, 60);

    BookingInputs inputs =
        bookingValidationService.validateInputs(
            request.roomId(), request.checkIn(), request.checkOut(), request.guestCount());

    if (hasBookingConflict(request.roomId(), request.checkIn(), request.checkOut())) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    BookingPrice price =
        bookingPricingService.calculatePrice(inputs.monthlyPriceKrw(), inputs.nights());
    String customerNotes = normalizeNotes(request.customerNotes());

    Profile customer = profileRepository.getReferenceById(user.id());
    Room room = roomRepository.getReferenceById(inputs.roomId());
    Property property = propertyRepository.getReferenceById(inputs.propertyId());

    BookingStatus status;
    BookingType bookingType;
    OffsetDateTime holdExpiresAt;
    if ("instant".equals(inputs.bookingMode())) {
      status = BookingStatus.pending_payment;
      bookingType = BookingType.instant;
      holdExpiresAt =
          OffsetDateTime.now(ZoneOffset.UTC)
              .plusMinutes(bookingPricingService.getHoldTtlMinutes());
    } else {
      status = BookingStatus.requested;
      bookingType = BookingType.request;
      holdExpiresAt = null;
    }

    Booking booking =
        BookingFactory.newHold(
            customer,
            room,
            property,
            request.checkIn(),
            request.checkOut(),
            request.guestCount(),
            status,
            bookingType,
            holdExpiresAt,
            customerNotes);

    try {
      booking = bookingRepository.save(booking);
      bookingPriceSnapshotRepository.save(
          BookingFactory.newPriceSnapshot(
              booking,
              price.rentKrw(),
              price.serviceFeeKrw(),
              price.totalKrw(),
              price.pricingVersion(),
              buildNightlyBreakdown(inputs, price)));
    } catch (DataIntegrityViolationException exception) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    if (bookingType == BookingType.request) {
      bookingNotificationService.notifyBookingRequest(booking);
    }

    return BookingMapper.toBooking(booking);
  }

  @Transactional
  public BookingDto cancelBooking(AuthenticatedUser user, UUID bookingId) {
    Booking booking =
        bookingRepository
            .findById(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));

    if (!booking.getCustomerId().equals(user.id())) {
      throw new ForbiddenException("Cannot cancel this booking");
    }

    if (bookingRepository.cancelByCustomer(bookingId, user.id()) == 0) {
      throw new BadRequestException("Booking cannot be cancelled");
    }

    return BookingMapper.toBooking(
        bookingRepository.findById(bookingId).orElseThrow());
  }

  @Transactional
  public BookingDto approveBooking(AuthenticatedUser user, UUID bookingId) {
    Booking booking =
        bookingRepository
            .findById(bookingId)
            .orElseThrow(() -> new NotFoundException("Booking not found"));

    authorizationService.requireHostOfBooking(user, bookingId);

    if (booking.getStatus() != BookingStatus.requested) {
      throw new BadRequestException("Booking must be in requested status to approve");
    }

    if (hasBookingConflict(booking.getRoomId(), booking.getCheckIn(), booking.getCheckOut())) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    Profile approver = profileRepository.getReferenceById(user.id());
    OffsetDateTime holdExpiresAt =
        OffsetDateTime.now(ZoneOffset.UTC)
            .plusMinutes(bookingPricingService.getHoldTtlMinutes());

    try {
      if (bookingRepository.approveRequestedBooking(bookingId, holdExpiresAt, approver) == 0) {
        throw new BadRequestException("Booking must be in requested status to approve");
      }
    } catch (DataIntegrityViolationException exception) {
      throw new ConflictException("Selected dates conflict with an existing booking hold");
    }

    Booking approved =
        bookingRepository.findById(bookingId).orElseThrow();
    bookingNotificationService.notifyBookingConfirmed(approved);
    return BookingMapper.toBooking(approved);
  }

  @Transactional
  public BookingDto rejectBooking(AuthenticatedUser user, UUID bookingId) {
    bookingRepository
        .findById(bookingId)
        .orElseThrow(() -> new NotFoundException("Booking not found"));

    authorizationService.requireHostOfBooking(user, bookingId);

    if (bookingRepository.rejectRequestedBooking(bookingId) == 0) {
      throw new BadRequestException("Booking must be in requested status to reject");
    }

    Booking rejected =
        bookingRepository.findById(bookingId).orElseThrow();
    bookingNotificationService.notifyBookingRejected(rejected);
    return BookingMapper.toBooking(rejected);
  }

  private boolean hasBookingConflict(UUID roomId, java.time.LocalDate checkIn, java.time.LocalDate checkOut) {
    return bookingRepository.existsActiveConflict(
        roomId, checkIn, checkOut, ACTIVE_CONFLICT_STATUSES);
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

  private static String normalizeNotes(String customerNotes) {
    if (customerNotes == null) {
      return null;
    }
    String trimmed = customerNotes.strip();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private List<Map<String, Object>> buildNightlyBreakdown(
      BookingInputs inputs, BookingPrice price) {
    Map<String, Object> entry = new LinkedHashMap<>();
    entry.put("nights", inputs.nights());
    entry.put("monthly_price_krw", inputs.monthlyPriceKrw());
    entry.put("rent_krw", price.rentKrw());
    entry.put("service_fee_krw", price.serviceFeeKrw());
    return List.of(entry);
  }
}
