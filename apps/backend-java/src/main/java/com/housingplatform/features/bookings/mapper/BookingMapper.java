package com.housingplatform.features.bookings.mapper;

import com.housingplatform.features.bookings.dto.BookingDetail;
import com.housingplatform.features.bookings.dto.BookingDto;
import com.housingplatform.features.bookings.dto.BookingListItem;
import com.housingplatform.features.bookings.dto.BookingQuote;
import com.housingplatform.features.bookings.model.BookingListView;
import com.housingplatform.features.bookings.model.BookingInputs;
import com.housingplatform.features.bookings.model.BookingPrice;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.enums.BookingMode;

public final class BookingMapper {

  private BookingMapper() {}

  public static double calculateServiceFeePercent(int rentKrw, int serviceFeeKrw) {
    if (rentKrw <= 0) {
      return 0.0;
    }
    return Math.round((serviceFeeKrw / (double) rentKrw) * 1000.0) / 10.0;
  }

  public static BookingQuote toQuote(BookingInputs inputs, BookingPrice price) {
    return new BookingQuote(
        inputs.roomId(),
        inputs.propertyId(),
        BookingMode.valueOf(inputs.bookingMode()),
        inputs.nights(),
        price.rentKrw(),
        price.serviceFeeKrw(),
        price.totalKrw(),
        price.pricingVersion());
  }

  public static BookingDto toBooking(Booking booking) {
    return new BookingDto(
        booking.getId(),
        booking.getCustomerId(),
        booking.getRoomId(),
        booking.getPropertyId(),
        booking.getCheckIn(),
        booking.getCheckOut(),
        booking.getGuestCount(),
        booking.getStatus(),
        booking.getBookingType(),
        booking.getHoldExpiresAt(),
        booking.getCustomerNotes(),
        booking.getApprovedAt(),
        booking.getApprovedById(),
        booking.getCancelledAt(),
        booking.getPaymentRetryCount(),
        booking.getCreatedAt(),
        booking.getUpdatedAt());
  }

  public static BookingListItem toListItem(BookingListView row) {
    return new BookingListItem(
        row.id(),
        row.status(),
        row.bookingType(),
        row.checkIn(),
        row.checkOut(),
        row.guestCount(),
        row.propertyTitle(),
        row.district(),
        row.roomName(),
        row.totalKrw(),
        row.holdExpiresAt(),
        row.createdAt());
  }

  public static BookingDetail toDetail(BookingListView row) {
    BookingListItem listItem = toListItem(row);
    return new BookingDetail(
        listItem.id(),
        listItem.status(),
        listItem.bookingType(),
        listItem.checkIn(),
        listItem.checkOut(),
        listItem.guestCount(),
        listItem.propertyTitle(),
        listItem.district(),
        listItem.roomName(),
        listItem.totalKrw(),
        listItem.holdExpiresAt(),
        listItem.createdAt(),
        row.customerNotes(),
        row.rentKrw(),
        row.serviceFeeKrw(),
        calculateServiceFeePercent(row.rentKrw(), row.serviceFeeKrw()),
        row.pricingVersion(),
        row.propertyId(),
        row.roomId());
  }
}
