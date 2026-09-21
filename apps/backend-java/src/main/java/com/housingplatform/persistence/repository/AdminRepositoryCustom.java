package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.entity.HousingRequest;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import com.housingplatform.persistence.enums.HousingRequestStatus;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface AdminRepositoryCustom {

  record AdminPropertyRow(
      UUID id,
      String title,
      String slug,
      String propertyType,
      String district,
      String status,
      String bookingMode,
      Integer monthlyPriceMin,
      int roomCount,
      OffsetDateTime updatedAt,
      String hostDisplayName) {}

  record AdminHostRow(
      UUID id,
      String displayName,
      String status,
      String profileName,
      OffsetDateTime verifiedAt,
      OffsetDateTime createdAt) {}

  record AdminBookingRow(
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

  record AdminPaymentRow(
      UUID id,
      UUID orderId,
      UUID bookingId,
      int amountKrw,
      String status,
      String propertyTitle,
      String customerName,
      OffsetDateTime confirmedAt,
      OffsetDateTime createdAt) {}

  record HousingRequestRow(
      UUID id,
      String email,
      String desiredArea,
      LocalDate checkIn,
      LocalDate checkOut,
      Integer budgetMax,
      String accommodationType,
      String notes,
      String status,
      OffsetDateTime createdAt) {}

  record AuditLogRow(
      UUID id,
      String action,
      String entityType,
      UUID entityId,
      Map<String, Object> metadata,
      OffsetDateTime createdAt,
      String actorName) {}

  Map<String, Integer> getDashboardStats();

  List<AdminPropertyRow> listProperties();

  Property publishProperty(UUID propertyId);

  Property rejectPropertyReview(UUID propertyId);

  List<AdminHostRow> listHosts();

  Host approveHost(UUID hostId);

  List<AdminBookingRow> listBookings();

  List<AdminPaymentRow> listPayments();

  List<HousingRequestRow> listHousingRequests();

  HousingRequest updateHousingRequestStatus(UUID requestId, HousingRequestStatus status);

  List<AuditLogRow> listAuditLogs();

  void writeAuditLog(
      UUID actorId, String action, String entityType, UUID entityId, Map<String, Object> metadata);
}
