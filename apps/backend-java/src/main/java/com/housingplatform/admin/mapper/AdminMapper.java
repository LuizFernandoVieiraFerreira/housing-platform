package com.housingplatform.admin.mapper;

import com.housingplatform.admin.dto.AdminHost;
import com.housingplatform.admin.dto.AdminPayment;
import com.housingplatform.admin.dto.AdminProperty;
import com.housingplatform.admin.dto.AuditLogDto;
import com.housingplatform.admin.dto.HousingRequestDto;
import com.housingplatform.admin.AdminRepository.AdminHostRow;
import com.housingplatform.admin.AdminRepository.AdminPaymentRow;
import com.housingplatform.admin.AdminRepository.AdminPropertyRow;
import com.housingplatform.admin.AdminRepository.AuditLogRow;
import com.housingplatform.admin.AdminRepository.HousingRequestRow;
import com.housingplatform.hosts.mapper.HostMapper;
import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.entity.HousingRequest;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.HousingRequestStatus;
import com.housingplatform.persistence.enums.PaymentStatus;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.properties.dto.PropertyStatusChange;

public final class AdminMapper {

  private AdminMapper() {}

  public static AdminProperty toAdminProperty(AdminPropertyRow row) {
    var base = HostMapper.toPropertyListItem(
        new com.housingplatform.hosts.HostRepository.HostPropertyListRow(
            row.id(),
            row.title(),
            row.slug(),
            row.propertyType(),
            row.district(),
            row.status(),
            row.bookingMode(),
            row.monthlyPriceMin(),
            row.roomCount(),
            row.updatedAt()));
    return new AdminProperty(
        base.id(),
        base.title(),
        base.slug(),
        base.propertyType(),
        base.district(),
        base.status(),
        base.bookingMode(),
        base.monthlyPriceMin(),
        base.roomCount(),
        base.updatedAt(),
        row.hostDisplayName());
  }

  public static AdminHost toAdminHost(AdminHostRow row) {
    return new AdminHost(
        row.id(),
        row.displayName(),
        row.status(),
        row.profileName(),
        row.verifiedAt(),
        row.createdAt());
  }

  public static AdminPayment toAdminPayment(AdminPaymentRow row) {
    return new AdminPayment(
        row.id(),
        row.orderId(),
        row.bookingId(),
        row.amountKrw(),
        PaymentStatus.valueOf(row.status()),
        row.propertyTitle(),
        row.customerName(),
        row.confirmedAt(),
        row.createdAt());
  }

  public static HousingRequestDto toHousingRequest(HousingRequestRow row) {
    return new HousingRequestDto(
        row.id(),
        row.email(),
        row.desiredArea(),
        row.checkIn(),
        row.checkOut(),
        row.budgetMax(),
        row.accommodationType() == null
            ? null
            : AccommodationType.fromDbValue(row.accommodationType()),
        row.notes(),
        HousingRequestStatus.fromDbValue(row.status()),
        row.createdAt());
  }

  public static HousingRequestDto toHousingRequest(HousingRequest request) {
    return new HousingRequestDto(
        request.getId(),
        request.getEmail(),
        request.getDesiredArea(),
        request.getCheckIn(),
        request.getCheckOut(),
        request.getBudgetMax(),
        request.getAccommodationType(),
        request.getNotes(),
        request.getStatus(),
        request.getCreatedAt());
  }

  public static AuditLogDto toAuditLog(AuditLogRow row) {
    return new AuditLogDto(
        row.id(),
        row.action(),
        row.entityType(),
        row.entityId(),
        row.actorName(),
        row.metadata(),
        row.createdAt());
  }

  public static PropertyStatusChange toPropertyStatusChange(
      java.util.UUID propertyId, PropertyStatus status) {
    return new PropertyStatusChange(propertyId, status);
  }
}
