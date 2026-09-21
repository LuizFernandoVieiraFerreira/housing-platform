package com.housingplatform.hosts.mapper;

import com.housingplatform.hosts.dto.HostBooking;
import com.housingplatform.hosts.dto.HostDto;
import com.housingplatform.hosts.dto.HostPropertyListItem;
import com.housingplatform.hosts.HostRepository.HostBookingRow;
import com.housingplatform.hosts.HostRepository.HostPropertyListRow;
import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import com.housingplatform.persistence.enums.PropertyStatus;

public final class HostMapper {

  private HostMapper() {}

  public static HostDto toDto(Host host) {
    return new HostDto(
        host.getId(),
        host.getProfileId(),
        host.getDisplayName(),
        host.getStatus(),
        host.getVerifiedAt(),
        host.getCreatedAt(),
        host.getUpdatedAt());
  }

  public static HostPropertyListItem toPropertyListItem(HostPropertyListRow row) {
    return new HostPropertyListItem(
        row.id(),
        row.title(),
        row.slug(),
        AccommodationType.fromDbValue(row.propertyType()),
        row.district(),
        PropertyStatus.valueOf(row.status()),
        BookingMode.valueOf(row.bookingMode()),
        row.monthlyPriceMin(),
        row.roomCount(),
        row.updatedAt());
  }

  public static HostBooking toHostBooking(HostBookingRow row) {
    return new HostBooking(
        row.id(),
        row.status(),
        row.bookingType(),
        row.checkIn(),
        row.checkOut(),
        row.guestCount(),
        row.customerNotes(),
        row.propertyTitle(),
        row.roomName(),
        row.totalKrw(),
        row.createdAt());
  }
}
