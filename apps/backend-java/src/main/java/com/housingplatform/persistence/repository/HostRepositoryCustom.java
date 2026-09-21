package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HostRepositoryCustom {

  record HostPropertyListRow(
      UUID id,
      String title,
      String slug,
      String propertyType,
      String district,
      String status,
      String bookingMode,
      Integer monthlyPriceMin,
      int roomCount,
      OffsetDateTime updatedAt) {}

  record HostBookingRow(
      UUID id,
      BookingStatus status,
      BookingType bookingType,
      LocalDate checkIn,
      LocalDate checkOut,
      int guestCount,
      String customerNotes,
      String propertyTitle,
      String roomName,
      int totalKrw,
      OffsetDateTime createdAt) {}

  Optional<Host> findByProfileId(UUID profileId);

  Host register(UUID profileId, String displayName);

  List<HostPropertyListRow> listProperties(UUID hostId);

  boolean propertyBelongsToHost(UUID hostId, UUID propertyId);

  List<HostBookingRow> listBookings(UUID hostId);
}
