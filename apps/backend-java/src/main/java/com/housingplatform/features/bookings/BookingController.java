package com.housingplatform.features.bookings;

import com.housingplatform.shared.auth.AuthSupport;
import com.housingplatform.features.bookings.dto.BookingDetail;
import com.housingplatform.features.bookings.dto.BookingDto;
import com.housingplatform.features.bookings.dto.BookingListItem;
import com.housingplatform.features.bookings.dto.BookingQuote;
import com.housingplatform.features.bookings.dto.BookingQuoteQuery;
import com.housingplatform.features.bookings.dto.CreateBookingRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/bookings")
public class BookingController {

  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @GetMapping("/quote")
  public BookingQuote quoteBooking(@Valid @ModelAttribute BookingQuoteQuery query) {
    String rateLimitActor =
        AuthSupport.currentUserOptional()
            .map(user -> user.id().toString())
            .orElse("anon");
    return bookingService.quote(query, rateLimitActor);
  }

  @GetMapping
  public List<BookingListItem> listBookings() {
    return bookingService.listMyBookings(AuthSupport.requireCurrentUser());
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public BookingDto createBooking(@Valid @RequestBody CreateBookingRequest request) {
    return bookingService.createBookingHold(AuthSupport.requireCurrentUser(), request);
  }

  @GetMapping("/{bookingId}")
  public BookingDetail getBooking(@PathVariable UUID bookingId) {
    return bookingService.getBookingDetail(AuthSupport.requireCurrentUser(), bookingId);
  }

  @PostMapping("/{bookingId}/cancel")
  public BookingDto cancelBooking(@PathVariable UUID bookingId) {
    return bookingService.cancelBooking(AuthSupport.requireCurrentUser(), bookingId);
  }

  @PostMapping("/{bookingId}/approve")
  public BookingDto approveBooking(@PathVariable UUID bookingId) {
    return bookingService.approveBooking(AuthSupport.requireCurrentUser(), bookingId);
  }

  @PostMapping("/{bookingId}/reject")
  public BookingDto rejectBooking(@PathVariable UUID bookingId) {
    return bookingService.rejectBooking(AuthSupport.requireCurrentUser(), bookingId);
  }
}
